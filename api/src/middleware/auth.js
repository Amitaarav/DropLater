function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token = header?.split(' ')[1]; // Bearer <token>
  if (!token || token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { authMiddleware };
