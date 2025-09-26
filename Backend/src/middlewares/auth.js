const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../models/db');

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'Missing token' });
      return next();
    }
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.sub);
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
