const prisma = require("../config/database");
const { invalidatePlanCache } = require("../utils/subscriptionHelper");

async function createAuditLog(adminId, action, resource, resourceId, details, ipAddress) {
  try {
    await prisma.auditLog.create({
      data: { actorId: adminId, action, resource, resourceId, details, ipAddress },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

// ===================== MEMBERSHIP PLANS =====================

const getMembershipPlans = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === "true" ? { isActive: true } : {};
    const plans = await prisma.membershipPlan.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    res.status(500).json({ error: "Failed to fetch membership plans" });
  }
};

const createMembershipPlan = async (req, res) => {
  try {
    const { key, name, description, price, currency, durationDays, planType, features, isActive, sortOrder } = req.body;

    if (!key || !name || !planType) {
      return res.status(400).json({ error: "key, name, and planType are required" });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }

    const existing = await prisma.membershipPlan.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ error: "A plan with this key already exists" });
    }

    const plan = await prisma.membershipPlan.create({
      data: {
        key,
        name,
        description: description || null,
        price: Number(price),
        currency: "Birr",
        durationDays: Number(durationDays) || 0,
        planType,
        features: features || [],
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    await createAuditLog(req.user.userId, "membership_plan_created", "membership_plan", plan.id, { key, name, price }, req.ip);
    invalidatePlanCache();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error("Error creating membership plan:", error);
    res.status(500).json({ error: "Failed to create membership plan" });
  }
};

const updateMembershipPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, currency, durationDays, planType, features, isActive, sortOrder } = req.body;

    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Plan not found" });

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(currency !== undefined && { currency }),
        ...(durationDays !== undefined && { durationDays: Number(durationDays) }),
        ...(planType !== undefined && { planType }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    await createAuditLog(req.user.userId, "membership_plan_updated", "membership_plan", id, req.body, req.ip);
    invalidatePlanCache();
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("Error updating membership plan:", error);
    res.status(500).json({ error: "Failed to update membership plan" });
  }
};

const deleteMembershipPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Plan not found" });

    await prisma.membershipPlan.delete({ where: { id } });
    await createAuditLog(req.user.userId, "membership_plan_deleted", "membership_plan", id, { key: existing.key }, req.ip);
    invalidatePlanCache();
    res.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    console.error("Error deleting membership plan:", error);
    res.status(500).json({ error: "Failed to delete membership plan" });
  }
};

// ===================== CONTACT CREDIT PACKAGES =====================

const getCreditPackages = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === "true" ? { isActive: true } : {};
    const packages = await prisma.contactCreditPackage.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error("Error fetching credit packages:", error);
    res.status(500).json({ error: "Failed to fetch credit packages" });
  }
};

const createCreditPackage = async (req, res) => {
  try {
    const { key, name, credits, price, currency, isActive, sortOrder } = req.body;

    if (!key || !name) {
      return res.status(400).json({ error: "key and name are required" });
    }
    if (credits === undefined || credits < 1) {
      return res.status(400).json({ error: "credits must be at least 1" });
    }
    if (price === undefined || price < 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }

    const existing = await prisma.contactCreditPackage.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ error: "A package with this key already exists" });
    }

    const pkg = await prisma.contactCreditPackage.create({
      data: {
        key,
        name,
        credits: Number(credits),
        price: Number(price),
        currency: "Birr",
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    await createAuditLog(req.user.userId, "credit_package_created", "credit_package", pkg.id, { key, name, credits }, req.ip);
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error creating credit package:", error);
    res.status(500).json({ error: "Failed to create credit package" });
  }
};

const updateCreditPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, credits, price, currency, isActive, sortOrder } = req.body;

    const existing = await prisma.contactCreditPackage.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Package not found" });

    const pkg = await prisma.contactCreditPackage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(credits !== undefined && { credits: Number(credits) }),
        ...(price !== undefined && { price: Number(price) }),
        ...(currency !== undefined && { currency }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    await createAuditLog(req.user.userId, "credit_package_updated", "credit_package", id, req.body, req.ip);
    res.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Error updating credit package:", error);
    res.status(500).json({ error: "Failed to update credit package" });
  }
};

const deleteCreditPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.contactCreditPackage.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Package not found" });

    await prisma.contactCreditPackage.delete({ where: { id } });
    await createAuditLog(req.user.userId, "credit_package_deleted", "credit_package", id, { key: existing.key }, req.ip);
    res.json({ success: true, message: "Package deleted" });
  } catch (error) {
    console.error("Error deleting credit package:", error);
    res.status(500).json({ error: "Failed to delete credit package" });
  }
};

// ===================== PAYMENT METHODS =====================

const getPaymentMethods = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === "true" ? { isActive: true } : {};
    const methods = await prisma.paymentMethod.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json({ success: true, data: methods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
};

const createPaymentMethod = async (req, res) => {
  try {
    const { key, name, instructions, accountInfo, isActive, sortOrder } = req.body;

    if (!key || !name) {
      return res.status(400).json({ error: "key and name are required" });
    }

    const existing = await prisma.paymentMethod.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ error: "A payment method with this key already exists" });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        key,
        name,
        instructions: instructions || null,
        accountInfo: accountInfo || null,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });

    await createAuditLog(req.user.userId, "payment_method_created", "payment_method", method.id, { key, name }, req.ip);
    res.status(201).json({ success: true, data: method });
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({ error: "Failed to create payment method" });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, instructions, accountInfo, isActive, sortOrder } = req.body;

    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Payment method not found" });

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(instructions !== undefined && { instructions }),
        ...(accountInfo !== undefined && { accountInfo }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    await createAuditLog(req.user.userId, "payment_method_updated", "payment_method", id, req.body, req.ip);
    res.json({ success: true, data: method });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ error: "Failed to update payment method" });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Payment method not found" });

    await prisma.paymentMethod.delete({ where: { id } });
    await createAuditLog(req.user.userId, "payment_method_deleted", "payment_method", id, { key: existing.key }, req.ip);
    res.json({ success: true, message: "Payment method deleted" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
};

// ===================== USER CONTACT CREDITS =====================

const getMyContactCredits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const creditRecord = await prisma.userContactCredit.findUnique({ where: { userId } });
    res.json({ success: true, data: creditRecord || { userId, credits: 0, usedCredits: 0 } });
  } catch (error) {
    console.error("Error fetching contact credits:", error);
    res.status(500).json({ error: "Failed to fetch contact credits" });
  }
};

const ensureContactCredits = async (userId) => {
  return prisma.userContactCredit.upsert({
    where: { userId },
    update: {},
    create: { userId, credits: 0, usedCredits: 0 },
  });
};

module.exports = {
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getCreditPackages,
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getMyContactCredits,
  ensureContactCredits,
};
