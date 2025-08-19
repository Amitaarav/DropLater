import { ZodError } from 'zod';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err);
  
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid data format',
      details: [`Invalid ${err.path}: ${err.value}`]
    });
  }
  
  // Default server error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? [err.message] : ['Something went wrong']
  });
};

export default errorHandler;