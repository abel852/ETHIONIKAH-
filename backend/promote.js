const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const u = await prisma.user.update({
    where: { email: "admin@islamicmatch.com" },
    data: { adminRole: "super_admin" },
  });
  console.log("Super admin:", u.firstName, u.adminRole);
  await prisma.$disconnect();
})();
