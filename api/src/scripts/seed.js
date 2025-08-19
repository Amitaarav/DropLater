import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Note from './api/src/models/Note.js';
import logger from './api/src/utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook_scheduler';

const sampleNotes = [
  {
    title: 'Welcome Message',
    body: 'Welcome to our service! This is your first scheduled message.',
    releaseAt: dayjs().add(2, 'minutes').toDate(),
    webhookUrl: 'http://localhost:4000/sink',
    status: 'pending'
  },
  {
    title: 'Daily Reminder',
    body: 'Don\'t forget to check your dashboard today!',
    releaseAt: dayjs().add(1, 'hour').toDate(),
    webhookUrl: 'http://localhost:4000/sink',
    status: 'pending'
  },
  {
    title: 'Already Delivered',
    body: 'This message was delivered successfully.',
    releaseAt: dayjs().subtract(1, 'day').toDate(),
    webhookUrl: 'http://localhost:4000/sink',
    status: 'delivered',
    deliveredAt: dayjs().subtract(23, 'hours').toDate(),
    attempts: [{
      at: dayjs().subtract(23, 'hours').toDate(),
      statusCode: 200,
      ok: true
    }]
  },
  {
    title: 'Failed Delivery',
    body: 'This message failed to deliver.',
    releaseAt: dayjs().subtract(2, 'hours').toDate(),
    webhookUrl: 'http://localhost:4000/sink',
    status: 'failed',
    attempts: [{
      at: dayjs().subtract(2, 'hours').toDate(),
      statusCode: 500,
      ok: false,
      error: 'HTTP 500: Internal Server Error'
    }]
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');
    
    // Clear existing notes
    await Note.deleteMany({});
    logger.info('Cleared existing notes');
    
    // Insert sample notes
    await Note.insertMany(sampleNotes);
    logger.info(`Inserted ${sampleNotes.length} sample notes`);
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();