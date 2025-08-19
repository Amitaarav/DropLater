import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import authMiddleware from './middleware/auth.js';
import rateLimitMiddleware from './middleware/rateLimit.js';
import errorHandler from './middleware/errorHandler.js';
import notesRoutes from './routes/notes.js';
import healthRoutes from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimitMiddleware);

// Serve admin UI from public folder
app.use('/admin', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/health', healthRoutes);
app.use('/api/notes', authMiddleware, notesRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      logger.info(`API server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;