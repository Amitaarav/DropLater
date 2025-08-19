import express from 'express';
import { connectRedis } from './config/redis.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.SINK_PORT || 4000;

// Middleware
app.use(express.json());

let redisClient = null;

// Initialize Redis connection
const initRedis = async () => {
  redisClient = await connectRedis();
};

// Main sink endpoint
app.post('/sink', async (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const noteId = req.headers['x-note-id'];
  
  logger.info('Received webhook delivery', {
    noteId,
    idempotencyKey: idempotencyKey ? idempotencyKey.substring(0, 8) + '...' : 'none',
    body: req.body
  });
  
  // Check if we should simulate failure
  if (process.env.SINK_FAIL_MODE === 'true') {
    logger.warn('SINK_FAIL_MODE enabled, returning 500');
    return res.status(500).json({ error: 'Simulated failure' });
  }
  
  try {
    if (!idempotencyKey) {
      logger.warn('Missing idempotency key');
      return res.status(400).json({ error: 'Missing X-Idempotency-Key header' });
    }
    
    // Check for duplicate delivery using Redis SETNX
    const key = `idempotency:${idempotencyKey}`;
    const wasSet = await redisClient.setNX(key, '1');
    
    if (!wasSet) {
      // Already processed this delivery
      logger.info('Duplicate delivery detected', { noteId, idempotencyKey: idempotencyKey.substring(0, 8) + '...' });
      return res.status(200).json({ 
        message: 'Already processed',
        duplicate: true 
      });
    }
    
    // Set expiration for cleanup (24 hours)
    await redisClient.expire(key, 86400);
    
    // Process the delivery (for demo, just log it)
    logger.info('Processing webhook delivery', {
      noteId,
      title: req.body.title,
      body: req.body.body
    });
    
    res.status(200).json({ 
      message: 'Webhook received successfully',
      processed: true,
      noteId: req.body.id
    });
    
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'webhook-sink' });
});

// Toggle fail mode for testing
app.post('/toggle-fail', (req, res) => {
  const newMode = process.env.SINK_FAIL_MODE !== 'true';
  process.env.SINK_FAIL_MODE = newMode.toString();
  
  logger.info(`Fail mode toggled to: ${newMode}`);
  res.json({ failMode: newMode });
});

// Start server
const startServer = async () => {
  try {
    await initRedis();
    
    app.listen(PORT, () => {
      logger.info(`Sink server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start sink server:', error);
    process.exit(1);
  }
};

startServer();

export default app;