import { Hono } from 'hono';
import { LocalJobStoreAdapter } from '../services/job-store/job-store.adapter.js';

const jobStore = new LocalJobStoreAdapter();

const app = new Hono();

app.get('/:id', async (c) => {
    const jobId = c.req.param('id');
    const job = await jobStore.getJob(jobId);
    if (!job) {
        return c.json({ error: 'Job not found' }, 404);
    }
    return c.json(job);
});

app.patch('/:id', async (c) => {
    const jobId = c.req.param('id');
    const job = await jobStore.getJob(jobId);
    if (!job) {
        return c.json({ error: 'Job not found' }, 404);
    }
    const body = await c.req.json();
    const updatedJob = { ...job, ...body };
    await jobStore.updateJob(updatedJob);
    return c.json(updatedJob);
});

export default app;
