import { Queue } from 'bullmq';

// Here A job is created for each event
function createQueue() {

  const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
  };

  const name = process.env.QUEUE_EVENTS || 'events';
  return new Queue(name, { connection });
  
}

module.exports = { createQueue };
