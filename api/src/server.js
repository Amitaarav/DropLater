import express from 'express';
import dotenv from "dotenv"
import pino from 'pino';
import { z } from 'zod';
import dayjs from 'dayjs';
import path from 'path';

import { connectMongo } from './db';
import Event from './models/event';
import { createQueue } from './queue';
dotenv.config();

const PORT = Number(process.env.API_PORT || 3000);
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

(async () => {
  await connectMongo();
  const app = express();
  const queue = createQueue();

  app.use(express.json());

  // Serve admin/static (optional)
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: dayjs().toISOString()
    });
  });

  // Validate and enqueue an event
  const EventSchema = z.object({
    type: z.string().min(1),
    payload: z.record(z.any())
  });

  app.post('/events', async (req, res) => {
    const parse = EventSchema.safeParse(req.body);

    if (!parse.success) {
      return res.status(400).json({ error: parse.error.flatten() });
    }

    const { type, payload } = parse.data;

    // store in mongo
    const doc = await Event.create({ type, payload });

    // push job to worker
    await queue.add('deliver', { id: String(doc._id), type, payload }, { removeOnComplete: true, attempts: 3 });

    logger.info({ id: doc._id, type }, 'Event stored and enqueued');
    res.status(202).json({ id: doc._id, status: 'queued' });

  });

  app.listen(PORT, () => {
    logger.info(`API listening on :${PORT}`);
  });

  process.on('SIGINT', async () => {
    logger.info('API shutting down...');
    await queue.close();
    process.exit(0);
  });
})();
