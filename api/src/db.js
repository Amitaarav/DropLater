import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function connectMongo() {
  const uri = process.env.MONGO_URL || 'mongodb://localhost:27017/app';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info({ uri }, 'Mongo connected');
}

module.exports = { connectMongo };
