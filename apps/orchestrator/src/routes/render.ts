import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { parseBarChartRace, parseTemplateId } from '@video-render-platform/shared';
import { LocalStorageAdapter } from '../services/storage/storage.adapter.js';
import { readUploadJson } from '../utils/io.js';
import { LocalJobStoreAdapter } from '../services/job-store/job-store.adapter.js';

const app = new Hono();
const storage = new LocalStorageAdapter();
const jobStore = new LocalJobStoreAdapter();

app.post('/', async (c) => {
  const body = await c.req.formData();
  const file = body.get('file');
  const templateId = body.get('templateId');

  if (!(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const parsedTemplateId = parseTemplateId(templateId);
  if (!parsedTemplateId.success) {
    return c.json({ error: 'Invalid templateId' }, 400);
  }

  const upload = await readUploadJson(file);
  if (!upload.ok) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!parseBarChartRace(upload.json).success) {
    return c.json({ error: 'Invalid file' }, 400);
  }

  const jobId = randomUUID();
  await storage.saveInput(jobId, upload.text);
  const job = await jobStore.createJob({
    jobId,
    templateId: parsedTemplateId.data
  });

  return c.json({ jobId, status: job.status, statusUrl: `/jobs/${jobId}` });
});

export default app;
