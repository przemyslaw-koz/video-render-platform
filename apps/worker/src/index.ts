import { getJob, Job, patchJob, type PatchJobBody } from './orchestrator-client.js';
import { runRemotion } from './run-remotion.js';

const statusMatrix = {
  RUNNING: () => ({
    status: 'RUNNING' as const,
    startedAt: new Date().toISOString(),
  }),
  DONE: () => ({
    status: 'DONE' as const,
    finishedAt: new Date().toISOString(),
  }),
  FAILED: (errorMessage: string) => ({
    status: 'FAILED' as const,
    finishedAt: new Date().toISOString(),
    errorMessage,
  }),
};

type PatchableStatus = keyof typeof statusMatrix;

const jobId = process.argv[2];

const job = await fetchJob(jobId);

await setJobStatus(jobId, 'RUNNING');

console.log('running remotion');

try {
  await runRemotion({
    inputPath: job.inputPath,
    outputPath: job.outputPath,
    templateId: job.templateId,
  });

  await setJobStatus(jobId, 'DONE');
} catch (error) {
  console.error('error running remotion:', error);

  try {
    await setJobStatus(
      jobId,
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error',
    );
  } catch (patchError) {
    console.error('failed to update job status:', patchError);
  }

  process.exit(1);
}

async function fetchJob(jobId: string): Promise<Job> {
  if (!jobId) {
    console.error('Usage: bun src/index.ts <jobId>');
    process.exit(1);
  }

  const job = await getJob(jobId);
  console.log('fetched job:', JSON.stringify(job, null, 2));

  return job;
}

async function setJobStatus(
  jobId: string,
  status: PatchableStatus,
  errorMessage?: string,
) {
  const body: PatchJobBody =
    status === 'FAILED'
      ? statusMatrix.FAILED(errorMessage ?? 'Unknown error')
      : statusMatrix[status]();

  const patchedJob = await patchJob(jobId, body);
  console.log('patched job:', JSON.stringify(patchedJob, null, 2));
}
