import rateLimit from 'express-rate-limit';

const rateLimitMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    error: 'Too many requests',
    details: ['Rate limit exceeded. Try again later.']
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default rateLimitMiddleware;