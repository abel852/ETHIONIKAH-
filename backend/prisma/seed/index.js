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
      data: { passwordHash: adminPassword, adminRole: "super_admin" },
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
        adminRole: "super_admin",
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
    console.log(`Admin created: ${admin.email}`);
  }

  console.log("Default admin password: admin123");

  // Seed membership plans
  console.log("Seeding membership plans...");
  const plans = [
    { key: "free", name: "Free Membership", description: "Basic access - browse and receive messages", price: 0, currency: "ETB", durationDays: 0, planType: "free", features: ["create_profile", "upload_photos", "browse_profiles", "receive_messages", "limited_daily_profiles"], isActive: true, sortOrder: 0 },
    { key: "gold", name: "Gold Membership", description: "Unlimited messaging and advanced features", price: 2400, currency: "ETB", durationDays: 365, planType: "subscription", features: ["unlimited_messaging", "unlimited_browsing", "advanced_search", "view_visitors", "view_likes", "priority_visibility", "no_credit_charges"], isActive: true, sortOrder: 1 },
    { key: "platinum", name: "Platinum Membership", description: "All Gold benefits plus VIP features", price: 4800, currency: "ETB", durationDays: 365, planType: "subscription", features: ["unlimited_messaging", "unlimited_browsing", "advanced_search", "view_visitors", "view_likes", "priority_visibility", "no_credit_charges", "featured_placement", "highest_search_ranking", "vip_badge", "personalized_matches", "vip_support", "early_access"], isActive: true, sortOrder: 2 },
    { key: "verification", name: "Identity Verification", description: "One-time verification fee for verified badge", price: 300, currency: "ETB", durationDays: 0, planType: "verification", features: ["verified_badge", "increased_trust", "higher_visibility"], isActive: true, sortOrder: 3 },
    { key: "boost", name: "Profile Boost", description: "7-day profile boost for maximum exposure", price: 100, currency: "ETB", durationDays: 7, planType: "boost", features: ["featured_placement", "top_search_ranking", "increased_exposure"], isActive: true, sortOrder: 4 },
  ];
  for (const p of plans) {
    await prisma.membershipPlan.upsert({ where: { key: p.key }, update: { price: p.price, durationDays: p.durationDays, features: p.features }, create: p });
  }
  console.log(`Seeded ${plans.length} membership plans`);

  // Seed contact credit packages
  console.log("Seeding contact credit packages...");
  const creditPackages = [
    { key: "credit_1", name: "1 Contact Credit", credits: 1, price: 100, currency: "ETB", isActive: true, sortOrder: 0 },
    { key: "credit_5", name: "5 Contact Credits", credits: 5, price: 400, currency: "ETB", isActive: true, sortOrder: 1 },
    { key: "credit_10", name: "10 Contact Credits", credits: 10, price: 700, currency: "ETB", isActive: true, sortOrder: 2 },
  ];
  for (const c of creditPackages) {
    await prisma.contactCreditPackage.upsert({ where: { key: c.key }, update: { credits: c.credits, price: c.price }, create: c });
  }
  console.log(`Seeded ${creditPackages.length} credit packages`);

  // Seed payment methods
  console.log("Seeding payment methods...");
  const paymentMethods = [
    { key: "telebirr", name: "Telebirr", instructions: "Send payment to the Telebirr number below. Include your reference number in the receipt.", accountInfo: "Phone: 0912345678", isActive: true, sortOrder: 0 },
    { key: "cbe_birr", name: "CBE Birr", instructions: "Send payment via CBE Birr to the account below.", accountInfo: "Account: 1000123456789", isActive: true, sortOrder: 1 },
    { key: "bank_transfer", name: "Bank Transfer", instructions: "Transfer to the bank account below and upload the receipt.", accountInfo: "Bank: CBE, Account: 1000123456789, Name: Ethio Nikah", isActive: true, sortOrder: 2 },
  ];
  for (const m of paymentMethods) {
    await prisma.paymentMethod.upsert({ where: { key: m.key }, update: { instructions: m.instructions, accountInfo: m.accountInfo }, create: m });
  }
  console.log(`Seeded ${paymentMethods.length} payment methods`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
