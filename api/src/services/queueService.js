import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import { getRedisClient } from '../config/redis.js';
import { generateIdempotencyKey } from '../utils/idempotency.js';
import logger from '../utils/logger.js';

let noteQueue = null;

export const initQueue = async () => {
  try {
    const redisClient = getRedisClient();
    
    noteQueue = new Queue('note-delivery', {
      connection: redisClient
    });
    
    logger.info('Note delivery queue initialized');
    return noteQueue;
  } catch (error) {
    logger.error('Failed to initialize queue:', error);
    throw error;
  }
};

export const enqueueNote = async (note) => {
  if (!noteQueue) {
    await initQueue();
  }
  
  const now = dayjs();
  const releaseTime = dayjs(note.releaseAt);
  const delay = Math.max(0, releaseTime.diff(now));
  
  const jobData = {
    noteId: note._id.toString(),
    title: note.title,
    body: note.body,
    webhookUrl: note.webhookUrl,
    releaseAt: note.releaseAt.toISOString(),
    idempotencyKey: generateIdempotencyKey(note._id.toString(), note.releaseAt.toISOString())
  };
  
  await noteQueue.add('deliver-note', jobData, {
    delay,
    jobId: `note-${note._id}`, // Prevent duplicate jobs
    removeOnComplete: 100,
    removeOnFail: 50
  });
  
  logger.info('Note enqueued', { 
    noteId: note._id,
    delay: delay > 0 ? `${delay}ms` : 'immediate'
  });
};

export const getQueue = () => noteQueue;

export default { initQueue, enqueueNote, getQueue };