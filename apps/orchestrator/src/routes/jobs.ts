import { Hono } from 'hono';
import { LocalJobStoreAdapter } from '../services/job-store/job-store.adapter.js';

const jobStore = new LocalJobStoreAdapter();

const app = new Hono();

app.get('/:id', async (c) =>{
    const jobId = c.req.param('id');
    const job = await jobStore.getJob(jobId);
    if (!job) {
        return c.json({ error: 'Job not found' }, 404);
    }
    return c.json(job);
})

export default app;