const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureAnonymousUser() {
  const anonEmail = 'anonymous@system.local';
  let anon = await prisma.user.findUnique({ where: { email: anonEmail }, select: { id: true } });
  if (!anon) {
    anon = await prisma.user.create({
      data: {
        email: anonEmail,
        name: 'Anonymous',
        role: 'ANONYMOUS',
        passwordHash: null
      },
      select: { id: true }
    });
  }
  prisma.anonymousUserId = anon.id; // attach for legacy usage
}

ensureAnonymousUser().catch(e => console.error('Failed to ensure anonymous user:', e));

module.exports = prisma;
