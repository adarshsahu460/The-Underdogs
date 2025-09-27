// Clerk-based auth middleware with legacy JWT fallback (for migration)
const jwt = require('jsonwebtoken');
const { getAuth, clerkClient } = require('@clerk/express');
const config = require('../config');
const prisma = require('../models/db');

async function resolveClerkUser(userId) {
  // Try by clerkUserId
  let user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true, email: true, name: true, clerkUserId: true } });
  if (user) return user;
  // Fetch from Clerk
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
  if (email) {
    user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, clerkUserId: true } });
  }
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email || `${userId}@users.clerk.generated`,
        name: clerkUser.firstName || null,
        clerkUserId: userId
      },
      select: { id: true, email: true, name: true, clerkUserId: true }
    });
  } else if (!user.clerkUserId) {
    await prisma.user.update({ where: { id: user.id }, data: { clerkUserId: userId } });
  }
  return user;
}

function auth(required = true) {
  return async (req, res, next) => {
    try {
      const { userId } = getAuth(req);
      if (userId) {
        req.user = await resolveClerkUser(userId);
        return next();
      }
      // Legacy fallback JWT (remove once migration complete)
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
        if (required) return res.status(401).json({ error: 'Unauthorized' });
        return next();
      }
      try {
        const payload = jwt.verify(token, config.jwt.secret);
        const legacyUser = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
        if (!legacyUser) return res.status(401).json({ error: 'Unauthorized' });
        req.user = legacyUser;
        return next();
      } catch (e) {
        if (required) return res.status(401).json({ error: 'Unauthorized' });
        return next();
      }
    } catch (err) {
      console.error('Auth middleware error', err);
      if (required) return res.status(401).json({ error: 'Unauthorized' });
      return next();
    }
  };
}

module.exports = auth;
