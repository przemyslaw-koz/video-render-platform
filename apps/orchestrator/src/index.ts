import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import jobsRoute from './routes/jobs.js'
import renderRoute from './routes/render.js'

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', (c) => {
  return c.text('OK')
})

app.get('/ready', (c) => {
  return c.text('OK')
})

app.route('/render', renderRoute);
app.route('/jobs', jobsRoute);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
