const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (!expectedToken) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: ['ADMIN_TOKEN not configured']
    });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      details: ['Provide Authorization header with Bearer token']
    });
  }
  
  const token = authHeader.substring(7);
  
  if (token !== expectedToken) {
    return res.status(401).json({
      error: 'Invalid authentication token',
      details: ['Token does not match expected value']
    });
  }
  
  next();
};

export default authMiddleware;