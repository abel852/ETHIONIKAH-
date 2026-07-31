const bcrypt = require("bcryptjs");
const prisma = require("../src/config/database");

async function verifyPassword() {
  const email = "admin@islamicmatch.com";
  const password = "^Z8!rQ@5vL#9xP^dW*7mF$kJ%4tN&yB+3hS=G{2c}U>0a<qE|6oT~1jI?8bM";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true, isActive: true, deletedAt: true },
    });

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("User found:", { id: user.id, email: user.email, role: user.role, isActive: user.isActive, deletedAt: user.deletedAt });
    console.log("Stored hash:", user.passwordHash);

    const matches = await bcrypt.compare(password, user.passwordHash);
    console.log("Password matches hash:", matches);

    if (!matches) {
      // Re-hash and update
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      console.log("Password re-hashed and updated.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPassword();
