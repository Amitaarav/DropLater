import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook_scheduler');
    logger.info(`Worker MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Worker database connection error:', error);
    throw error;
  }
};

export default mongoose;