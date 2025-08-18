import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,             // 60 requests per minute per IP
  message: { error: 'Too many requests, try again later' }
});

module.exports = { limiter };
