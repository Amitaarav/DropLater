import axios from 'axios';
import Note from '../models/Note.js';
import logger from '../utils/logger.js';

const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;

const RETRY_DELAYS = (process.env.RETRY_DELAYS || '1000,5000,25000')
    .split(',')
    .map(delay => parseInt(delay));

export const deliverNote = async (job) => {
  const { noteId, title, body, webhookUrl, idempotencyKey } = job.data;
  const attemptNumber = (job.attemptsMade || 0) + 1;
  
  logger.info('Delivering note', { 
    noteId, 
    attempt: attemptNumber, 
    maxRetries: MAX_RETRIES 
  });
  
  const startTime = Date.now();
  let attempt = {
    at: new Date(),
    statusCode: 0,
    ok: false,
    error: null
  };
  
  try {
    const response = await axios.post(webhookUrl, {
      id: noteId,
      title,
      body
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Note-Id': noteId,
        'X-Idempotency-Key': idempotencyKey
      },
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    attempt.statusCode = response.status;
    attempt.ok = response.status >= 200 && response.status < 300;

    if (attempt.ok) {
      await Note.findByIdAndUpdate(noteId, {
        $push: { attempts: attempt },
        $set: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });
      
      logger.info('Note delivered successfully', {
        noteId,
        statusCode: response.status,
        duration: `${duration}ms`
      });
      
      return { success: true, statusCode: response.status };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.response) {
      attempt.statusCode = error.response.status;
      attempt.error = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else {
      attempt.statusCode = 0;
      attempt.error = error.message;
    }

    const shouldRetry = attemptNumber < MAX_RETRIES;
    const finalStatus = shouldRetry ? 'failed' : 'dead';

    await Note.findByIdAndUpdate(noteId, {
      $push: { attempts: attempt },
      $set: { status: finalStatus }
    });
    
    logger.error('Note delivery failed', {
      noteId,
      attempt: attemptNumber,
      statusCode: attempt.statusCode,
      error: attempt.error,
      duration: `${duration}ms`,
      finalStatus
    });
    
    if (shouldRetry) {
      const delay = RETRY_DELAYS[attemptNumber - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      
      logger.info('Scheduling retry', {
        noteId,
        nextAttempt: attemptNumber + 1,
        delay: `${delay}ms`
      });
      
      // BullMQ will automatically retry based on job settings
      throw error;
    } else {
      // Final failure, don't retry
      return { 
        success: false, 
        statusCode: attempt.statusCode,
        error: attempt.error,
        final: true 
      };
    }
  }
};

export default { deliverNote };