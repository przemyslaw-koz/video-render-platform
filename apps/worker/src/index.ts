const jobId = process.argv[2];
const base = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3000';

if (!jobId) {
  console.error('Usage: bun src/index.ts <jobId>');
  process.exit(1);
}

const res = await fetch(`${base}/jobs/${jobId}`);

if (!res.ok) {
  console.error(`GET /jobs/${jobId} failed: ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const job = await res.json();
console.log("fetched job:", job.jobId);
console.log(JSON.stringify(job, null, 2));

const payload = {
    status: 'RUNNING',
    startedAt: new Date().toISOString()
}

// patch job status to RUNNING
const patchRes = await fetch(`${base}/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});

if (!patchRes.ok) {
    console.error(`PATCH /jobs/${jobId} failed: ${patchRes.status}`);
    console.error(await patchRes.text());
    process.exit(1);
}

const patchedJob = await patchRes.json();
console.log('patched job:', patchedJob.jobId);
console.log(JSON.stringify(patchedJob, null, 2));