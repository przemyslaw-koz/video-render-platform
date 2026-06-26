# ADR: Hybrid Cloud Video Rendering Pipeline

## Status

Proposed / MVP-ready

## Date

2026-06-23

## Context

The goal of this project is to build a hybrid cloud video rendering pipeline for generating programmatic videos such as **bar chart race animations**.

The local machine is a low-power thin client. It should be responsible for orchestration, not for heavy rendering work. Rendering should be offloaded to disposable AWS compute workers, preferably using **EC2 Spot Instances** for cost optimization.

The system should be:

- asynchronous
- cost-optimized
- secure by default
- resilient to worker interruption
- suitable as a DevOps / Node.js / AWS portfolio project
- simple enough to build incrementally

The video generation engine will be **Remotion**, because it allows videos to be defined as React / TypeScript components and rendered from structured JSON input.

---

# Decision Summary

## Main Decision

Use a **hybrid event-driven architecture**:

```text
Thin Client Orchestrator
  -> S3 input upload
  -> SQS render job message
  -> EC2 Spot Worker
  -> Remotion render
  -> S3 output upload
  -> job status update
```

The thin client will not render the final video. It will only submit jobs, upload input files, trigger or scale workers, and retrieve final artifacts.

---

# Technology Decisions

## 1. Orchestrator Runtime

### Decision

Use:

```text
Hono + Bun + TypeScript
```

for the local orchestrator/API service.

### Reasoning

Hono is a very good fit because:

- it is lightweight
- it has a clean API
- it works well with TypeScript
- it runs on Bun, Node.js, Cloudflare Workers, Lambda, and other runtimes
- it is enough for this project without the overhead of NestJS

Bun is a good fit for the orchestrator because:

- startup is fast
- TypeScript support is convenient
- package management is fast
- the orchestrator is not doing risky native/headless browser rendering work

### Alternatives Considered

#### Express
Rejected for this project because it is fine but less modern and less elegant than Hono for a fresh TypeScript service.

#### Fastify
Good alternative. More mature than Hono in classic Node.js server environments, but a little heavier. Worth considering if the API grows significantly.

#### NestJS
Rejected for MVP. It would be good for a larger enterprise-style backend, but it adds unnecessary boilerplate for the first version.

### Final Choice

```text
Orchestrator: Hono + Bun + TypeScript
```

---

## 2. Worker Runtime

### Decision

Use:

```text
Node.js LTS + TypeScript
```

for the EC2 render worker.

### Reasoning

Although Bun is a good runtime for the orchestrator, the worker will run Remotion, Chromium, and FFmpeg. This part of the system is more sensitive to runtime compatibility.

Node.js LTS is the safer default for:

- Remotion CLI
- Chromium / Puppeteer-like workflows
- FFmpeg integration
- production debugging
- long-term compatibility

### Final Choice

```text
Worker: Node.js LTS + TypeScript
```

---

## 3. Video Rendering Framework

### Decision

Use:

```text
Remotion
```

### Reasoning

Remotion allows videos to be expressed as React components and rendered programmatically from props.

It is a good match for:

- data-driven animations
- bar chart race videos
- dynamic titles
- dynamic themes
- templates
- JSON-based input
- future multi-template support

### Final Choice

```text
Video engine: Remotion + React + TypeScript
```

---

## 4. Chart / Animation Logic

### Decision

Use:

```text
React components + D3 utility packages
```

Recommended packages:

```text
d3-scale
d3-array
d3-interpolate
```

### Reasoning

D3 should not necessarily own the DOM. React / Remotion should render the visual structure, while D3 should help with:

- scales
- sorting
- ranking
- interpolation
- value mapping

This keeps the code readable and compatible with Remotion.

### Final Choice

```text
Render UI with React.
Use D3 only for math and data transformations.
```

---

## 5. Job Queue

### Decision

Use:

```text
AWS SQS
```

### Reasoning

SQS is a simple, durable, cheap, managed queue.

It is suitable because:

- render jobs are asynchronous
- EC2 Spot workers can be interrupted
- failed messages can be retried
- a DLQ can capture broken jobs
- the thin client does not need a persistent connection to EC2

### Final Choice

```text
Queue: SQS + DLQ
```

---

## 6. Input and Output Storage

### Decision

Use:

```text
AWS S3
```

for both input and output artifacts.

### Reasoning

SQS should not carry large render payloads. The orchestrator should upload the full JSON input to S3 and only send metadata through SQS.

This avoids:

- SQS payload size limits
- messy retries
- large queue messages
- direct communication between thin client and EC2

### Final Choice

```text
S3 input prefix:  s3://bucket/inputs/{jobId}/input.json
S3 output prefix: s3://bucket/outputs/{jobId}/video.mp4
```

---

## 7. Job State Store

### Decision

Use:

```text
DynamoDB for MVP
```

### Reasoning

DynamoDB is a good fit for simple job-state tracking:

- no server to manage
- simple key-value access pattern
- cheap at low scale
- easy integration with AWS SDK
- good enough for render job metadata

PostgreSQL may be used later if the project grows into a larger product with users, accounts, analytics, billing, and richer queries.

### Final Choice

```text
MVP: DynamoDB
Possible future: PostgreSQL
```

---

# System Architecture

## High-Level Flow

```text
[Client / User]
      |
      v
[Thin Client Orchestrator: Hono + Bun]
      |
      | 1. Upload input JSON
      v
[S3: inputs/{jobId}/input.json]
      |
      | 2. Send compact job message
      v
[SQS Render Queue]
      |
      | 3. EC2 Spot Worker pulls job
      v
[EC2 Spot Worker: Node.js + Remotion]
      |
      | 4. Download input JSON
      | 5. Render MP4
      | 6. Upload result
      v
[S3: outputs/{jobId}/video.mp4]
      |
      | 7. Update status
      v
[DynamoDB: render job state]
```

---

# Repository Structure

Recommended monorepo structure:

```text
video-rendering-pipeline/
├── apps/
│   ├── orchestrator/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── render.ts
│   │   │   │   └── jobs.ts
│   │   │   ├── services/
│   │   │   │   ├── s3.service.ts
│   │   │   │   ├── sqs.service.ts
│   │   │   │   ├── dynamodb.service.ts
│   │   │   │   └── ec2.service.ts
│   │   │   ├── schemas/
│   │   │   │   └── render-input.schema.ts
│   │   │   └── config.ts
│   │   ├── package.json
│   │   └── bun.lock
│   │
│   ├── worker/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── sqs-consumer.ts
│   │   │   ├── render-job.ts
│   │   │   ├── remotion-runner.ts
│   │   │   ├── s3-artifacts.ts
│   │   │   └── self-terminate.ts
│   │   ├── package.json
│   │   └── package-lock.json
│   │
│   └── remotion/
│       ├── src/
│       │   ├── index.ts
│       │   ├── Root.tsx
│       │   ├── compositions/
│       │   │   └── BarChartRace.tsx
│       │   ├── components/
│       │   │   ├── Bar.tsx
│       │   │   ├── Chart.tsx
│       │   │   └── Title.tsx
│       │   ├── lib/
│       │   │   ├── interpolate-data.ts
│       │   │   ├── ranking.ts
│       │   │   └── scales.ts
│       │   └── types.ts
│       ├── package.json
│       └── remotion.config.ts
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── contracts/
│       │   │   ├── render-input.ts
│       │   │   ├── sqs-message.ts
│       │   │   └── job-status.ts
│       │   └── validators/
│       │       └── render-input.validator.ts
│       └── package.json
│
├── infra/
│   └── terraform/
│       ├── environments/
│       │   └── dev/
│       │       ├── main.tf
│       │       ├── variables.tf
│       │       ├── outputs.tf
│       │       └── terraform.tfvars.example
│       └── modules/
│           ├── s3/
│           ├── sqs/
│           ├── dynamodb/
│           ├── iam/
│           ├── ec2-worker/
│           ├── budget-guard/
│           └── networking/
│
├── docs/
│   ├── adr-hybrid-cloud-video-rendering-pipeline.md
│   ├── hybrid-cloud-video-rendering-pipeline.md
│   └── poc-open-items.md
│
├── scripts/
│   ├── build-worker-ami.sh
│   ├── render-local.sh
│   └── benchmark.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── docker-build.yml
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# API Contract

## Submit Render Job

```http
POST /render
Content-Type: application/json
```

### Request Body

```json
{
  "templateId": "bar-chart-race",
  "title": "Top Programming Languages",
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "durationSeconds": 480,
  "data": [
    {
      "timestamp": "2020-01-01",
      "name": "JavaScript",
      "value": 67.7,
      "category": "language"
    },
    {
      "timestamp": "2020-01-01",
      "name": "Python",
      "value": 44.1,
      "category": "language"
    }
  ],
  "options": {
    "topN": 10,
    "showValues": true,
    "theme": "default"
  }
}
```

### Response Body

```json
{
  "jobId": "job-01JZEXAMPLE",
  "status": "QUEUED",
  "statusUrl": "/jobs/job-01JZEXAMPLE"
}
```

---

## Get Job Status

```http
GET /jobs/{jobId}
```

### Response Body

```json
{
  "jobId": "job-01JZEXAMPLE",
  "status": "RUNNING",
  "templateId": "bar-chart-race",
  "createdAt": "2026-06-23T10:00:00.000Z",
  "startedAt": "2026-06-23T10:01:00.000Z",
  "finishedAt": null,
  "downloadUrl": null,
  "errorMessage": null
}
```

---

# SQS Message Contract

The SQS message should be compact and should not contain the full video dataset.

```json
{
  "jobId": "job-01JZEXAMPLE",
  "templateId": "bar-chart-race",
  "inputS3Bucket": "video-render-input-dev",
  "inputS3Key": "inputs/job-01JZEXAMPLE/input.json",
  "outputS3Bucket": "video-render-output-dev",
  "outputS3Key": "outputs/job-01JZEXAMPLE/video.mp4",
  "createdAt": "2026-06-23T10:00:00.000Z"
}
```

---

# DynamoDB Model

## Table Name

```text
video-render-jobs
```

## Primary Key

```text
PK: jobId
```

## Example Item

```json
{
  "jobId": "job-01JZEXAMPLE",
  "templateId": "bar-chart-race",
  "status": "RUNNING",
  "inputS3Bucket": "video-render-input-dev",
  "inputS3Key": "inputs/job-01JZEXAMPLE/input.json",
  "outputS3Bucket": "video-render-output-dev",
  "outputS3Key": "outputs/job-01JZEXAMPLE/video.mp4",
  "instanceId": "i-0123456789abcdef0",
  "createdAt": "2026-06-23T10:00:00.000Z",
  "startedAt": "2026-06-23T10:01:00.000Z",
  "finishedAt": null,
  "errorMessage": null,
  "renderDurationSeconds": null,
  "ttl": 1782218400
}
```

## Job Status Values

```text
QUEUED
STARTING
RUNNING
RENDERED
UPLOADED
DONE
FAILED
CANCELLED
```

---

# IAM Design

## Orchestrator IAM Permissions

The local thin client should use a restricted IAM user or role.

Required permissions:

```text
s3:PutObject
s3:GetObject
sqs:SendMessage
dynamodb:PutItem
dynamodb:GetItem
dynamodb:UpdateItem
ec2:RunInstances
ec2:CreateTags
iam:PassRole
```

Scope these permissions to:
- specific S3 buckets
- specific SQS queue
- specific DynamoDB table
- specific EC2 launch template / AMI / instance profile where possible

---

## Worker IAM Permissions

The EC2 worker should use an instance profile.

Required permissions:

```text
sqs:ReceiveMessage
sqs:DeleteMessage
sqs:ChangeMessageVisibility
s3:GetObject
s3:PutObject
dynamodb:GetItem
dynamodb:UpdateItem
ec2:TerminateInstances
```

The worker should not have:
- broad admin access
- long-lived access keys
- inbound SSH dependency
- permission to modify unrelated AWS resources

---

# EC2 Worker Design

## Recommended Initial Instance Families

Start with CPU Spot:

```text
c7i.2xlarge
c7i.4xlarge
c7a.2xlarge
c6i.2xlarge
m7i.2xlarge
```

GPU should be benchmarked later:

```text
g4dn.xlarge
g5.xlarge
```

## Worker Lifecycle

```text
BOOT
  -> start safety timer
  -> pull SQS message
  -> mark job RUNNING
  -> download input JSON
  -> run Remotion render
  -> upload output MP4
  -> mark job DONE
  -> delete SQS message
  -> terminate instance
```

## Safety Timeout

Use multiple safety layers:

```bash
sudo shutdown -P +40
```

But this is only a fallback.

The preferred safety model is:

```text
worker-level timeout
+ SQS visibility timeout
+ stale-instance cleanup Lambda
+ AWS Budget alert
```

---

# Render Command

Example render command:

```bash
npx remotion render apps/remotion/src/index.ts bar-chart-race \
  --props='{"inputPath":"./input.json"}' \
  out/video.mp4
```

Depending on Chromium setup, Xvfb may be needed:

```bash
xvfb-run -a npx remotion render apps/remotion/src/index.ts bar-chart-race \
  --props='{"inputPath":"./input.json"}' \
  out/video.mp4
```

---

# Terraform Resources

## MVP Resources

```text
aws_s3_bucket.input
aws_s3_bucket.output
aws_sqs_queue.render_jobs
aws_sqs_queue.render_jobs_dlq
aws_dynamodb_table.render_jobs
aws_iam_role.worker
aws_iam_instance_profile.worker
aws_iam_policy.worker
aws_iam_user.orchestrator
aws_iam_policy.orchestrator
aws_launch_template.worker
aws_security_group.worker
```

## Phase 2 Resources

```text
aws_cloudwatch_log_group.worker
aws_lambda_function.stale_worker_cleanup
aws_cloudwatch_event_rule.cleanup_schedule
aws_cloudwatch_event_target.cleanup_lambda
aws_budgets_budget.monthly_guard
aws_sns_topic.budget_alerts
aws_lambda_function.budget_killer
```

---

# Security Decisions

## No Inbound Traffic

The EC2 worker security group should have:

```text
Inbound: none
Outbound: HTTPS to AWS APIs / internet as needed
```

No SSH.
No public HTTP.
No public app port.

## Debugging

Prefer:

```text
AWS Systems Manager Session Manager
```

instead of SSH.

This requires:
- SSM agent installed
- instance profile with SSM permissions
- private or public access to SSM endpoints

---

# Cost Control Decisions

## Primary Cost Controls

```text
EC2 Spot
short-lived worker instances
S3 lifecycle rules
worker self-termination
stale-instance cleanup
SQS retry limits
DynamoDB TTL
```

## Emergency Cost Controls

```text
AWS Budgets
SNS alert
Lambda emergency cleanup
```

Important note:

AWS Budgets should be treated as a financial backstop, not as real-time runtime control.

---

# Error Handling

## Worker Failure

If rendering fails:

1. update job status to `FAILED`
2. write error message to DynamoDB
3. upload logs if possible
4. delete or do not delete SQS message depending on retry policy
5. terminate instance

## Spot Interruption

If Spot is interrupted:

1. worker may receive a two-minute interruption notice
2. mark job as retryable if possible
3. allow SQS visibility timeout to expire
4. another worker retries the job

## Poison Messages

Use DLQ after configured retry count.

Suggested max receive count:

```text
3
```

---

# Observability

## Logs

Use CloudWatch logs for:

- worker boot logs
- render command output
- Remotion errors
- upload status
- job lifecycle events

## Metrics

Track:

```text
render duration
job count
failed jobs
successful jobs
average cost estimate
worker startup time
queue depth
SQS age of oldest message
```

## Possible Future Grafana Integration

Since this project fits well into a DevOps portfolio, later add:

- CloudWatch metrics dashboard
- Prometheus exporter for local orchestrator
- Grafana dashboard for render pipeline status

---

# Benchmark Plan

## Benchmark Targets

Compare:

```text
thin client
EC2 CPU Spot
EC2 GPU Spot
Remotion Lambda
```

## Test Matrix

```text
30 seconds, 1080p, 30 fps
2 minutes, 1080p, 30 fps
8 minutes, 1080p, 30 fps
8 minutes, 4K, 30 fps
```

## Metrics

Measure:

```text
total render time
frame render time
encoding time
instance cost
estimated cost per render
memory usage
CPU usage
GPU usage if applicable
```

## Decision Rule

GPU becomes the default only if:

```text
GPU render time improvement is large enough to justify the higher cost and operational complexity.
```

Example:

```text
If GPU is 2x more expensive but only 20% faster, stay on CPU.
If GPU is 5x more expensive but 8x faster, consider GPU.
```

---

# Implementation Plan

## Phase 1: Local Remotion Proof of Concept

Goal:
- render a bar chart race from JSON locally

Tasks:
- create Remotion project
- create sample input JSON
- create `BarChartRace` composition
- use D3 utilities for ranking/scaling
- render 30-second MP4 locally
- document render time

---

## Phase 2: Orchestrator MVP

Goal:
- accept render request and create a job

Tasks:
- create Hono + Bun API
- implement `POST /render`
- validate input using Zod
- generate `jobId`
- upload input JSON to S3
- create DynamoDB job item
- send SQS message
- implement `GET /jobs/:jobId`

---

## Phase 3: Worker MVP

Goal:
- one worker can process one job and terminate itself

Tasks:
- create Node.js worker
- read one SQS message
- download input JSON from S3
- run Remotion render
- upload MP4 to S3
- update DynamoDB status
- delete SQS message
- terminate EC2 instance

---

## Phase 4: Terraform MVP

Goal:
- provision required AWS infrastructure

Tasks:
- S3 input/output buckets
- SQS queue + DLQ
- DynamoDB table
- IAM user/role/policies
- EC2 launch template
- worker security group
- lifecycle rules
- basic outputs

---

## Phase 5: Reliability

Goal:
- make the system safe to run repeatedly

Tasks:
- SQS visibility timeout tuning
- DLQ redrive policy
- stale worker cleanup Lambda
- CloudWatch logs
- budget alert
- instance tagging
- DynamoDB TTL

---

## Phase 6: Benchmarking

Goal:
- decide whether CPU, GPU, or Lambda is best

Tasks:
- benchmark thin client
- benchmark CPU Spot
- benchmark GPU Spot
- benchmark Remotion Lambda
- document results
- choose default rendering target

---

# Final Decision

The project will be built as a hybrid cloud rendering pipeline with:

```text
Orchestrator: Hono + Bun + TypeScript
Worker: Node.js LTS + TypeScript
Rendering: Remotion + React
Queue: SQS
Storage: S3
Job state: DynamoDB
Compute: EC2 CPU Spot first
Infrastructure: Terraform
```

GPU will not be the default for MVP. It will be treated as an optimization path after benchmark results are available.

This architecture is cost-aware, secure, event-driven, and well suited for a practical DevOps / AWS / Node.js portfolio project.
