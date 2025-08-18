const express = require('express');
const pino = require('pino');
const { z } = require('zod');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const PORT = Number(process.env.SINK_PORT || 4000);

const app = express();
app.use(express.json());

// Basic validation of incoming event
const IncomingSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  payload: z.record(z.any())
});

app.post('/webhook', (req, res) => {
  const parse = IncomingSchema.safeParse(req.body);
  if (!parse.success) {
    logger.warn({ err: parse.error.flatten() }, 'Invalid webhook payload');
    return res.status(400).json({ error: 'invalid payload' });
  }
  logger.info({ event: parse.data }, 'Webhook received');
  res.status(200).json({ ok: true });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => logger.info(`Sink listening on :${PORT}`));

module.exports = app;