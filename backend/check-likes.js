require("dotenv").config();
const prisma = require("./src/config/database");

(async () => {
  const allMatches = await prisma.match.findMany({
    include: {
      user: { select: { firstName: true } },
      matchedUser: { select: { firstName: true } },
    },
  });
  console.log("All matches:", JSON.stringify(allMatches.map(m => ({
    id: m.id,
    user: m.user?.firstName,
    matchedUser: m.matchedUser?.firstName,
    status: m.status,
  })), null, 2));

  // Check likes-sent for Abel
  const abelId = "2fb58c5b-0d45-4fb1-8efe-30270ef1a0d2";
  const likesSent = await prisma.match.findMany({
    where: { userId: abelId },
    include: { matchedUser: { select: { firstName: true } } },
  });
  console.log("Abel's likes sent:", JSON.stringify(likesSent.map(m => ({
    matchedUser: m.matchedUser?.firstName,
    status: m.status,
  })), null, 2));

  await prisma.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
