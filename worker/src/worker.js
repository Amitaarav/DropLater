import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { deliverNote } from './services/deliveryService.js';
import { startNotePoller } from './services/pollingService.js';
import logger from './utils/logger.js';

async function startWorker() {
  try {
    // Connect to databases
    await connectDB();
    const redisConnection = await connectRedis();
    
    // Start the BullMQ worker
    const worker = new Worker('note-delivery', deliverNote, {
      connection: redisConnection,
      concurrency: 5
    });
    
    worker.on('completed', (job) => {
      logger.info('Job completed', { jobId: job.id, noteId: job.data.noteId });
    });
    
    worker.on('failed', (job, err) => {
      logger.error('Job failed', { jobId: job.id, noteId: job.data.noteId, error: err.message });
    });
    
    // Start polling service for due notes
    startNotePoller();
    
    logger.info('Worker started successfully');
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await worker.close();
      await mongoose.connection.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker();