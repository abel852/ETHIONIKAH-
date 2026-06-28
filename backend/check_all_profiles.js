const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const profiles = await p.profile.findMany({
    select: { id: true, userId: true, photos: true, isProfileComplete: true, maritalStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Profiles:', JSON.stringify(profiles, null, 2));
  await p.$disconnect();
})();
