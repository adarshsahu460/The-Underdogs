const { Router } = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const db = require('../models/db');

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'EngiVerse API', docs: 'TBD' });
});
// router.post('/upload', (req, res) => {
//   console.log(req.body);
//   res.json({ message: JSON.stringify(req.body)});
// });

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// WARNING: /list exposes entire DB (MVP/debug). Protect with auth in production.
router.get('/list', (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, name, created_at FROM users').all();
    const projects = db.prepare(`SELECT * FROM projects ORDER BY id DESC`).all();
    const aiReports = db.prepare('SELECT * FROM ai_reports ORDER BY id DESC').all();
    const adoptions = db.prepare('SELECT * FROM adoptions ORDER BY id DESC').all();
    return res.json({ users, projects, aiReports, adoptions });
  } catch (e) {
    console.error('/list error', e);
    return res.status(500).json({ error: 'Failed to list data', detail: e.message });
  }
});

module.exports = router;
