const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { OR: [{ role: "admin" }, { adminRole: { not: null } }] },
    select: { email: true, firstName: true, lastName: true, role: true, adminRole: true, isVerified: true },
  });
  console.log("=== ADMIN USERS ===");
  if (admins.length === 0) {
    console.log("No admin users found. Run: npx prisma db seed");
  } else {
    admins.forEach(a => console.log(`${a.email} - ${a.firstName} ${a.lastName} | role: ${a.role} | adminRole: ${a.adminRole || "null"}`));
  }

  // Fix: set adminRole to super_admin for admin users missing it
  const updated = await prisma.user.updateMany({
    where: { role: "admin", adminRole: null },
    data: { adminRole: "super_admin" },
  });
  if (updated.count > 0) {
    console.log(`\nFixed ${updated.count} admin user(s) with missing adminRole -> set to super_admin`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
