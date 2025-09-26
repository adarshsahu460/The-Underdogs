const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../models/db');
const config = require('../config');

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = { register, login };
