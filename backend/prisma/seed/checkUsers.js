const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ["ahmed@ethionikah.com","yusuf@ethionikah.com","ibrahim@ethionikah.com"] } },
    include: { profile: true },
  });
  for (const u of users) {
    console.log(`${u.email} - profile: ${u.profile ? "YES" : "NO"}`);
    if (!u.profile) {
      // Delete the user so it can be re-created
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`  Deleted ${u.email} (no profile)`);
    }
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
