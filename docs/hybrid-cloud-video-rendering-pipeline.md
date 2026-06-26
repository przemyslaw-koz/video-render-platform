# Hybrid Cloud Video Rendering Pipeline

A cost-optimized, secure, and event-driven hybrid cloud architecture designed to offload heavy video rendering workloads from a local low-power device (thin client) to high-performance AWS Spot Instances.

The project uses **Remotion** (React-based video framework) for programmatic video generation and follows an asynchronous, decoupled workflow. The local machine acts as an orchestrator and does **not** render the final video itself. Instead, it uploads input data, schedules a rendering job, and waits for the result generated in AWS.

---

## 🏗️ Architecture Overview

The system is designed around a **hybrid cloud rendering model**:

- **Thin client** = lightweight orchestrator and control plane
- **AWS** = rendering execution environment
- **S3 + SQS** = decoupling layer between orchestration and compute
- **EC2 Spot worker** = disposable rendering node
- **DynamoDB / PostgreSQL** = job state tracking and observability

The local device should never need to keep a persistent connection to the EC2 instance while the video is being rendered.

---

## 📦 High-Level Components

### 1. Orchestrator (Local Thin Client)
A lightweight Node.js / Bun service running locally.

Responsibilities:
- receives rendering requests
- validates the payload
- uploads render input JSON to S3
- creates a render job entry in the job store
- sends a job message to SQS
- optionally triggers / scales EC2 Spot workers
- polls or receives completion status
- downloads the final video from S3

The orchestrator should **not** send large render payloads directly through SQS and should **not** stream video data to EC2.

---

### 2. Input Storage (AWS S3)
Stores render inputs and output artifacts.

Recommended usage:
- **input bucket / prefix** → render JSON, optional assets, metadata
- **output bucket / prefix** → rendered `.mp4` files, logs, optional thumbnails

Instead of placing the full render payload in SQS, the orchestrator uploads the input document to S3 and sends only a small message containing metadata such as:

```json
{
  "jobId": "job-2026-06-23-001",
  "templateId": "bar-chart-race",
  "inputS3Key": "inputs/job-2026-06-23-001/input.json",
  "outputS3Key": "outputs/job-2026-06-23-001/video.mp4"
}
```

This keeps the queue small, avoids SQS payload limits, and makes retries simpler.

---

### 3. Message Broker (AWS SQS)
Acts as the decoupling layer between the orchestrator and the render worker.

Responsibilities:
- stores render jobs
- allows the orchestrator and worker to be fully asynchronous
- enables retries and dead-letter handling
- prevents the thin client from needing to maintain a long-lived session with the worker

Recommended queue setup:
- **main queue** for render jobs
- **dead-letter queue (DLQ)** for failed jobs after retry threshold

---

### 4. Job Store (DynamoDB or PostgreSQL)
Stores render job state and metadata.

Suggested states:

```text
QUEUED -> STARTING -> RUNNING -> RENDERED -> UPLOADED -> DONE
                               \-> FAILED
```

Suggested fields:
- `jobId`
- `templateId`
- `status`
- `inputS3Key`
- `outputS3Key`
- `instanceId`
- `createdAt`
- `startedAt`
- `finishedAt`
- `errorMessage`
- `renderDurationSeconds`

This is important because S3 alone is not a good system of record for job state.

---

### 5. Compute Worker (AWS EC2 Spot Instance)
A disposable worker instance that performs the heavy rendering work.

Recommended starting point:
- **CPU Spot instance first**, not GPU
- example families to test first:
  - `c7i`
  - `c7a`
  - `c6i`
  - `m7i`

Only consider GPU instances (`g4dn`, `g5`) **after benchmarking**, because bar chart race rendering is often more CPU / Chromium / FFmpeg bound than GPU bound.

The worker should be based on a prebuilt AMI or bootstrapped image containing:
- Node.js / Bun runtime
- Remotion project
- Chromium dependencies
- FFmpeg
- AWS CLI
- CloudWatch agent or log shipper (optional but recommended)

---

## 🎬 Rendering Strategy

The worker does not receive the full render payload from the thin client directly.

Instead, the worker:
1. receives a small SQS message
2. downloads the input JSON from S3
3. injects the JSON into the Remotion composition as props
4. renders the video
5. uploads the final `.mp4` to S3
6. updates the job status
7. terminates itself

For a bar chart race workflow, the actual render input should usually live in S3 as JSON, for example:

```json
{
  "title": "Top Cities by Population",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "durationSeconds": 480,
  "data": [
    { "frame": 0, "name": "Tokyo", "value": 34450000 },
    { "frame": 0, "name": "Delhi", "value": 15680000 }
  ]
}
```

---

## 🔄 Workflow Execution Order

## 1. Job Initialization
The local thin client:
- receives a render request
- validates the JSON payload
- uploads the render input to **S3**
- creates a job entry in **DynamoDB / PostgreSQL**
- sends a compact job message to **SQS**

Example SQS payload:

```json
{
  "jobId": "job-2026-06-23-001",
  "templateId": "bar-chart-race",
  "inputS3Key": "inputs/job-2026-06-23-001/input.json",
  "outputS3Key": "outputs/job-2026-06-23-001/video.mp4"
}
```

---

## 2. Worker Provisioning
The orchestrator either:
- explicitly requests an **EC2 Spot Instance**, or
- ensures there is a worker fleet / Auto Scaling Group capable of pulling from the queue

For the first version of the project, a single ephemeral Spot instance triggered per job is acceptable and easy to understand.

---

## 3. Environment Startup
The EC2 Spot instance boots using a prebuilt AMI or a user-data bootstrap script.

On boot, the worker should:
- start a **hard safety timeout**
- fetch configuration
- start the render worker process

A simple OS-level safety timer is useful, but it should **power off** the machine rather than merely halt it:

```bash
sudo shutdown -P +40
```

However, this should be treated as a **last-resort safety net**, not as the primary termination mechanism.

---

## 4. Processing & Rendering
The worker:
- pulls a message from **SQS**
- marks the job as `RUNNING`
- downloads the input JSON from **S3**
- injects the JSON into the **Remotion** project as dynamic props
- executes the render command
- writes the rendered `.mp4` locally
- uploads the file to **S3**
- updates the job state

The exact render command can vary, but conceptually the worker runs something equivalent to:

```bash
npx remotion render src/index.ts bar-chart-race \
  --props='{"inputPath":"./input.json"}' \
  out/video.mp4
```

If a headless display layer is required in the chosen environment, `xvfb-run` may still be used depending on the Remotion / Chromium setup.

---

## 5. Artifact Delivery
Once rendering is complete:
- the worker uploads the final `.mp4` to the output S3 path
- the job state is updated to `UPLOADED` or `DONE`
- the thin client later downloads the finished video from S3

Optional enhancements:
- upload a thumbnail
- upload render logs
- write render metrics to CloudWatch or the job store

---

## 6. Self-Destruction (Graceful)
After successful upload — or after a fatal unrecoverable failure — the instance should terminate itself.

The worker can do this by:
- updating the job status
- deleting the SQS message
- calling the EC2 termination API on itself
- or allowing an Auto Scaling lifecycle / cleanup process to remove it

**Important:** the worker must have permission to:
- receive SQS messages
- delete SQS messages
- read from S3 input
- write to S3 output
- optionally update the job store
- optionally terminate itself

---

## 7. Result Retrieval
The thin client:
- polls the job store, or
- receives a notification, or
- checks S3 for completion

Once the file is ready, it downloads the rendered video and marks the job as complete locally.

---

# 🔐 Security & Cost Optimization Blueprint

## Financial Controls

### 1. EC2 Spot Pricing
Spot instances are the main cost optimization mechanism.

For this project, Spot makes sense because:
- renders are batch jobs
- the worker is disposable
- the pipeline is retryable
- bar chart race rendering is not latency-critical

### 2. CPU-First Benchmarking Strategy
Do **not** start with GPU by default.

Recommended approach:
1. build the first version on **CPU Spot**
2. benchmark representative renders
3. compare:
   - thin client
   - CPU Spot instance
   - GPU Spot instance
4. only move to GPU if the performance gain justifies the cost

This is especially important because:
- Remotion workloads are often limited by Chromium frame rendering and encoding
- a simple bar chart race animation may not benefit much from GPU acceleration
- GPU Spot capacity can be more expensive and less predictable

### 3. S3 Lifecycle Rules
Use lifecycle policies to clean up both:
- input JSON files
- output videos
- temporary artifacts

Example:
- delete render inputs after **24 hours**
- delete render outputs after **24–72 hours** if they are only temporary artifacts

### 4. Safety Timeouts
Use **multiple layers of protection**, not just one.

Recommended layers:
1. **application-level timeout** inside the worker process
2. **OS-level timeout** such as `shutdown -P +40`
3. **instance cleanup Lambda / scheduled job** for stale workers
4. **budget alarms / cost controls** at account level

### 5. Budget Protection
Using **AWS Budgets + SNS + Lambda** as a circuit breaker is a good idea, but it should not be treated as a real-time kill switch.

Budgets are excellent for:
- detecting abnormal spend
- sending alerts
- triggering cleanup workflows
- stopping non-critical infrastructure

But they should be considered a **financial backstop**, not the first line of runtime control.

A better overall protection model is:
- worker timeout
- stale-instance cleanup by tag / age
- SQS visibility timeout + retry policy
- budget-based emergency cleanup as the last resort

---

## Cyber Security & Hardening

### 1. Dark Worker / No Inbound Traffic
The EC2 worker should have **zero inbound ports open**.

Security Group policy:
- no inbound SSH
- no inbound HTTP/HTTPS
- only outbound access to required AWS services / internet destinations

This makes the worker effectively a **dark target**:
- it cannot be SSHed into from the internet
- it is not exposed via HTTP
- it only pulls jobs and uploads results

### 2. Session Manager Instead of SSH
If remote debugging is needed, prefer **AWS Systems Manager Session Manager** rather than opening port 22.

This gives you:
- no public SSH exposure
- better auditing
- easier operational control

### 3. Least Privilege IAM
Use separate IAM identities for the orchestrator and the worker.

#### Thin Client / Orchestrator IAM
Should be restricted to only what it needs, for example:
- `s3:PutObject` for input upload
- `sqs:SendMessage`
- `ec2:RunInstances` or Auto Scaling trigger permissions
- job store permissions if it writes job metadata

#### EC2 Worker Instance Profile
Should be restricted to only what it needs, for example:
- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `s3:GetObject` for input
- `s3:PutObject` for output
- job store update permissions
- optional `ec2:TerminateInstances` or self-termination mechanism

### 4. Immutable Worker Design
The worker should be treated as disposable and immutable:
- boot
- render
- upload
- terminate

Do not store important state locally on the instance.

---

# 🧱 Recommended AWS Resource Model

## Core Resources
- **S3 bucket** for render inputs
- **S3 bucket** for render outputs
- **SQS queue** for render jobs
- **SQS DLQ** for failed jobs
- **DynamoDB table** or **PostgreSQL database** for job state
- **EC2 Spot worker**
- **IAM role / instance profile** for worker
- **IAM user / role** for orchestrator
- **CloudWatch logs / metrics** for observability
- **AWS Budget + SNS + Lambda** for emergency cost protection

---

# 🛠️ Tech Stack

## Orchestration Layer
- **Node.js** or **Bun**
- AWS SDK
- lightweight API / daemon for job creation and orchestration

## Video Generation
- **Remotion**
- React
- TypeScript
- Chromium
- FFmpeg

## Cloud Infrastructure
- **AWS EC2 Spot**
- **AWS S3**
- **AWS SQS**
- **AWS DynamoDB** or **PostgreSQL**
- **AWS CloudWatch**
- **AWS Lambda**
- **AWS SNS**
- **AWS Budgets**

## Infrastructure as Code
- **Terraform**

## OS / Worker Runtime
- Ubuntu Server
- headless rendering environment
- optional Xvfb depending on Remotion / Chromium setup

---

# 🚀 Suggested Delivery Plan

Phase numbering matches the [ADR implementation plan](./adr-hybrid-cloud-video-rendering-pipeline.md#implementation-plan).

## Phase 1 — Local Remotion Proof of Concept
Goal:
- render a bar chart race video locally from JSON
- validate Remotion structure and render flow
- measure baseline render time on the thin client

Deliverables:
- Remotion project (`apps/remotion`)
- JSON schema for input
- one sample render
- benchmark notes

Status: **done** (PoC complete; code lives in `apps/remotion`).

---

## Phase 2 — Orchestrator MVP
Goal:
- accept render requests and create jobs from the thin client

Tasks:
- Hono + Bun API
- `POST /render` with Zod validation
- generate `jobId`
- upload input JSON to S3
- create DynamoDB job item
- send SQS message
- `GET /jobs/:jobId` for status polling

---

## Phase 3 — Worker MVP
Goal:
- one EC2 Spot worker processes one job and terminates itself

Tasks:
- Node.js worker pulls one SQS message
- download input JSON from S3
- run Remotion render
- upload MP4 to S3
- update DynamoDB status
- delete SQS message
- terminate EC2 instance

---

## Phase 4 — Terraform MVP
Goal:
- provision required AWS infrastructure

Deliverables:
- S3 input/output buckets
- SQS queue + DLQ
- DynamoDB table
- IAM user/role/policies
- EC2 launch template + worker security group
- lifecycle rules and basic outputs

End-to-end at this phase: thin client submits a job, worker renders in AWS, result lands in S3.

---

## Phase 5 — Reliability & FinOps
Goal:
- make the pipeline safe to run repeatedly and cheap to operate

Add:
- SQS visibility timeout tuning + DLQ redrive policy
- stale worker cleanup Lambda
- CloudWatch logging
- budget alerts
- instance tagging
- DynamoDB TTL
- S3 lifecycle rules
- retry strategy

---

## Phase 6 — Benchmarking & Optimization
Goal:
- decide whether CPU Spot, GPU Spot, or Lambda is the best default

Benchmark:
- thin client vs CPU Spot vs GPU Spot vs Remotion Lambda
- multiple video lengths and resolutions
- cost per render

Only after this phase should GPU become a default design choice.

---

## Future — Portfolio / Production Polish
Optional additions after the core pipeline is stable:
- signed S3 URLs for download
- multi-template support
- render history dashboard
- auth for job submission
- notifications on completion
- autoscaling worker fleet
- ECS / Batch version of the worker

---

# ✅ Final Recommendation

Yes — the overall concept absolutely makes sense.

The biggest architectural adjustment is this:

> **The thin client should not send the full render payload directly to EC2.**
> It should upload the render input to S3, send only job metadata through SQS, and let the EC2 worker pull everything it needs.

And the biggest implementation adjustment is this:

> **Start with CPU Spot, not GPU.**
> Benchmark first, then decide whether GPU is justified for your actual Remotion workload.

That version is:
- cheaper
- simpler
- more defensible architecturally
- better for learning
- better for a DevOps / Node / AWS portfolio project
