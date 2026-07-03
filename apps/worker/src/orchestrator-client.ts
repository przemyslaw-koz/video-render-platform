export type JobStatus =
    | 'QUEUED'
    | 'STARTING'
    | 'RUNNING'
    | 'RENDERED'
    | 'UPLOADED'
    | 'DONE'
    | 'FAILED';

export type Job = {
    jobId: string;
    templateId: string;
    status: JobStatus;
    inputPath: string;
    outputPath: string;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    downloadUrl: string | null;
    errorMessage: string | null;
};

export type PatchJobBody =
  | { status: 'RUNNING'; startedAt: string }
  | { status: 'DONE'; finishedAt: string }
  | { status: 'FAILED'; finishedAt: string; errorMessage: string };

const base = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3000';

export async function patchJob(jobId: string, body: PatchJobBody) {
  const res = await fetch(`${base}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },    
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`PATCH /jobs/${jobId} failed: ${res.status}`);
    const errorMessage = await res.text();  
    console.error(errorMessage);
    throw new Error(`PATCH /jobs/${jobId} failed: ${res.status} ${errorMessage}`);
  }

  const patchedJob = await res.json();
  return patchedJob;
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${base}/jobs/${jobId}`);
  if (!res.ok) {
    console.error(`GET /jobs/${jobId} failed: ${res.status}`);
    const errorMessage = await res.text();
    console.error(errorMessage);
    throw new Error(`GET /jobs/${jobId} failed: ${res.status} ${errorMessage}`);
  }
  const job = await res.json();
  return job;
}