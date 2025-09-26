const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../models/db');

function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'Missing token' });
      return next();
    }
    try {
  const payload = jwt.verify(token, config.jwt.secret);
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
  if (!user) return res.status(401).json({ error: 'Invalid token user' });
  req.user = user;
      next();
    } catch (e) {
      console.error(e);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

module.exports = auth;
