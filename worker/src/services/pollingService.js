import { Queue } from 'bullmq';
import dayjs from 'dayjs';
import Note from '../models/Note.js';
import { getRedisClient } from '../config/redis.js';
import { generateIdempotencyKey } from '../utils/idempotency.js';
import logger from '../utils/logger.js';

const POLLING_INTERVAL = 5000; // 5 seconds
let noteQueue = null;
let pollingTimer = null;

const initQueue = async () => {
  if (!noteQueue) {
    const redisClient = getRedisClient();
    noteQueue = new Queue('note-delivery', {
      connection: redisClient
    });
  }
  return noteQueue;
};

const pollForDueNotes = async () => {
  try {
    await initQueue();
    
    const now = new Date();
    
    // Find notes that are due for delivery
    const dueNotes = await Note.find({
      status: 'pending',
      releaseAt: { $lte: now }
    }).limit(100);
    
    if (dueNotes.length > 0) {
      logger.info(`Found ${dueNotes.length} due notes to process`);
      
      for (const note of dueNotes) {
        try {
          const jobData = {
            noteId: note._id.toString(),
            title: note.title,
            body: note.body,
            webhookUrl: note.webhookUrl,
            releaseAt: note.releaseAt.toISOString(),
            idempotencyKey: generateIdempotencyKey(note._id.toString(), note.releaseAt.toISOString())
          };
          
          await noteQueue.add('deliver-note', jobData, {
            jobId: `note-${note._id}`, // Prevent duplicate jobs
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              settings: {
                delay: 2000,
              },
            }
          });
          
          logger.debug('Note enqueued from polling', { noteId: note._id });
          
        } catch (error) {
          if (error.message.includes('already exists')) {
            // if Job already exists,then skip
            logger.debug('Job already exists for note', { noteId: note._id });
          } else {
            logger.error('Failed to enqueue note from polling', { 
              noteId: note._id, 
              error: error.message 
            });
          }
        }
      }
    }
    
  } catch (error) {
    logger.error('Error in polling service:', error);
  }
};

export const startNotePoller = () => {
  logger.info('Starting note polling service');
  
  // Initial poll
  pollForDueNotes();
  
  // Set up recurring polling
  pollingTimer = setInterval(pollForDueNotes, POLLING_INTERVAL);
  
  return pollingTimer;
};

export const stopNotePoller = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    logger.info('Note polling service stopped');
  }
};

export default { startNotePoller, stopNotePoller };