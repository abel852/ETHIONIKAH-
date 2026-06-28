const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);

  let admin = await prisma.user.findUnique({ where: { email: "admin@islamicmatch.com" } });

  if (admin) {
    admin = await prisma.user.update({
      where: { email: "admin@islamicmatch.com" },
      data: { passwordHash: adminPassword },
    });
    console.log(`Admin password updated: ${admin.email}`);
  } else {
    // Check if phone is taken
    const phoneExists = await prisma.user.findUnique({ where: { phone: "+251911000000" } });
    const phone = phoneExists ? `+25191100000${Date.now()}` : "+251911000000";
    admin = await prisma.user.create({
      data: {
        email: "admin@islamicmatch.com",
        phone,
        passwordHash: adminPassword,
        firstName: "Admin",
        lastName: "User",
        gender: "male",
        dateOfBirth: new Date("1990-01-01"),
        role: "admin",
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Admin created: ${admin.email}`);
  }

  console.log("Default admin password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
