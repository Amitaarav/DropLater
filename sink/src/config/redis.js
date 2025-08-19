import { createClient } from 'redis';
import logger from '../utils/logger.js';

export const connectRedis = async () => {
  try {
    const redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      logger.error('Sink Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Sink Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Sink Redis connection error:', error);
    throw error;
  }
};

export default { connectRedis };