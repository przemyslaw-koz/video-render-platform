import { Hono } from 'hono';

const app = new Hono();

app.post('/',async (c)=>c.json({message:'Send render request to SQS'}));

export default app;