const { Worker } = require('bullmq');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  // password: process.env.REDIS_PASSWORD,
};

const queueName = process.env.QUEUE_EVENTS || 'events';
const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:4000/webhook';

const worker = new Worker(queueName, async job => {
  logger.info({ id: job.id, name: job.name }, 'Processing job');

  // Forward to sink (webhook receiver)
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job.data)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook failed: ${res.status} ${text}`);
  }

  logger.info({ status: res.status }, 'Delivered to sink');
}, { connection });

worker.on('completed', job => logger.info({ id: job.id }, 'Job completed'));
worker.on('failed', (job, err) => logger.error({ id: job?.id, err }, 'Job failed'));

process.on('SIGINT', async () => {
  logger.info('Worker shutting down...');
  await worker.close();
  process.exit(0);
});
