const { Router } = require('express');
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const prisma = require('../models/db');

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Dev-Yard API', docs: 'TBD' });
});
// router.post('/upload', (req, res) => {
//   console.log(req.body);
//   res.json({ message: JSON.stringify(req.body)});
// });

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);

// WARNING: /list exposes entire DB (MVP/debug). Protect with auth in production.
router.get('/list', async (req, res) => {
  try {
    const [users, projects, aiReports, adoptions] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, name: true, createdAt: true } }),
      prisma.project.findMany({ orderBy: { id: 'desc' } }),
      prisma.aiReport.findMany({ orderBy: { id: 'desc' } }),
      prisma.adoption.findMany({ orderBy: { id: 'desc' } })
    ]);
    return res.json({ users, projects, aiReports, adoptions });
  } catch (e) {
    console.error('/list error', e);
    return res.status(500).json({ error: 'Failed to list data', detail: e.message });
  }
});

module.exports = router;
