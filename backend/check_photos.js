const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const profiles = await p.profile.findMany({ select: { id: true, userId: true, photos: true } });
  console.log('Total profiles:', profiles.length);
  profiles.forEach(prof => {
    const pid = prof.userId.substring(0, 8);
    console.log(`Profile ${prof.id} | user: ${pid}... | photos:`, JSON.stringify(prof.photos));
  });
  const users = await p.user.findMany({ select: { id: true, email: true, firstName: true } });
  console.log('\nUsers:');
  users.forEach(u => console.log(`  ${u.id.substring(0, 8)}... | ${u.email} | ${u.firstName}`));
  await p.$disconnect();
})();
