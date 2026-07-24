const prisma = require("../config/database");
const { createNotification } = require("../utils/notification");
const { emitPaymentStatus } = require("../utils/messageSocket");
const { ensureContactCredits } = require("./membershipPlanController");

async function createAuditLog(adminId, action, resource, resourceId, details, ipAddress) {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, resource, resourceId, details, ipAddress },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

async function ensureWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, credits: 0, totalSpent: 0 },
  });
}

// Fetch plan config from DB, fall back to hardcoded for legacy compatibility
async function getPlanConfig(planType) {
  const plan = await prisma.membershipPlan.findFirst({
    where: { key: planType, isActive: true },
  });
  if (plan) {
    return {
      type: plan.planType,
      price: plan.price,
      durationDays: plan.durationDays,
      features: plan.features,
      name: plan.name,
    };
  }
  // Legacy fallback for existing payments
  const LEGACY = {
    credit_1: { type: "credit", credits: 1, durationDays: 0, name: "1 Contact Credit" },
    credit_5: { type: "credit", credits: 5, durationDays: 0, name: "5 Contact Credits" },
    credit_10: { type: "credit", credits: 10, durationDays: 0, name: "10 Contact Credits" },
    credit: { type: "credit", credits: 1, durationDays: 0, name: "Contact Credit" },
    gold: { type: "subscription", durationDays: 365, name: "Gold Membership" },
    platinum: { type: "subscription", durationDays: 365, name: "Platinum Membership" },
    boost: { type: "boost", durationDays: 7, name: "Profile Boost" },
    verification: { type: "verification", durationDays: 0, name: "Identity Verification" },
  };
  // Book purchases — planType is "book:<bookId>"
  if (planType.startsWith("book:")) {
    const bookId = planType.split(":")[1];
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (book) return { type: "book", bookId, price: book.price, durationDays: 0, name: book.title };
  }
  return LEGACY[planType] || null;
}

// Fetch valid payment method keys from DB
async function getValidPaymentMethodKeys() {
  const methods = await prisma.paymentMethod.findMany({ where: { isActive: true } });
  if (methods.length > 0) return methods.map((m) => m.key);
  return ["telebirr", "cbe_birr", "bank_transfer"];
}

function getPlanEndDate(durationDays) {
  if (!durationDays) return null;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

async function activatePayment(payment, adminId) {
  const { userId, planType, amount } = payment;
  const config = await getPlanConfig(planType);

  if (!config) {
    throw new Error(`Unknown plan type: ${planType}`);
  }

  const activation = { type: config.type, applied: false };

  switch (config.type) {
    case "credit": {
      await ensureContactCredits(userId);
      await prisma.userContactCredit.update({
        where: { userId },
        data: {
          credits: { increment: config.credits || 0 },
        },
      });
      activation.applied = true;
      break;
    }
    case "subscription": {
      const endDate = getPlanEndDate(config.durationDays);
      // Expire any existing active subscriptions for this user
      await prisma.subscription.updateMany({
        where: { userId, status: "active" },
        data: { status: "expired" },
      });
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planType,
          status: "active",
          startDate: new Date(),
          endDate,
        },
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { subscriptionId: subscription.id },
      });
      activation.subscriptionId = subscription.id;
      activation.applied = true;
      break;
    }
    case "boost": {
      const endDate = getPlanEndDate(config.durationDays);
      const boost = await prisma.boost.create({
        data: {
          userId,
          paymentId: payment.id,
          status: "active",
          startsAt: new Date(),
          endsAt: endDate,
        },
      });
      activation.boostId = boost.id;
      activation.applied = true;
      break;
    }
    case "verification": {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
      await prisma.verification.updateMany({
        where: { userId, status: "pending" },
        data: { status: "approved" },
      });
      activation.applied = true;
      break;
    }
    case "book": {
      const bookId = config.bookId;
      await prisma.bookPurchase.create({
        data: { userId, bookId, amount, status: "approved" },
      }).catch(() => {}); // ignore if already exists
      activation.applied = true;
      break;
    }
    // Legacy wallet type for backward compatibility
    case "wallet": {
      const wallet = await ensureWallet(userId);
      await prisma.wallet.update({
        where: { userId },
        data: {
          credits: { increment: config.credits || 1 },
          totalSpent: { increment: amount },
        },
      });
      activation.walletId = wallet.id;
      activation.applied = true;
      break;
    }
  }

  return activation;
}

// User creates a payment request (uploads receipt + reference)
const createPaymentRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planType, amount, paymentMethod, transactionId, referenceNumber, receiptUrl, receiptFileType, receiptFileSize } = req.body;

    const config = await getPlanConfig(planType);
    if (!config) {
      return res.status(400).json({ error: "Invalid plan type" });
    }
    const validMethods = await getValidPaymentMethodKeys();
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid or inactive payment method" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }
    if (!referenceNumber || referenceNumber.trim().length < 3) {
      return res.status(400).json({ error: "Reference number is required" });
    }

    // Check for active subscription — only allow upgrades, not downgrades or same-tier re-purchases
    // Skip this check for book purchases
    if (config.type === "book") {
      // Check if user already owns the book
      const existingPurchase = await prisma.bookPurchase.findUnique({
        where: { userId_bookId: { userId, bookId: config.bookId } },
      });
      if (existingPurchase) {
        return res.status(400).json({ error: "You already own this book" });
      }
      // Check if there's already a pending payment for this book
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          userId,
          planType,
          status: "pending",
        },
      });
      if (pendingPayment) {
        return res.status(400).json({ error: "You already have a pending payment for this book. Please wait for admin verification." });
      }
    } else {
      const PLAN_TIER = { free: 0, gold: 1, platinum: 2 };
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: "active",
          endDate: { gte: new Date() },
          planType: { in: ["gold", "platinum"] },
        },
        orderBy: { endDate: "desc" },
      });

      if (activeSubscription) {
        const currentTier = PLAN_TIER[activeSubscription.planType] ?? 0;
        const requestedTier = PLAN_TIER[planType] ?? 0;

        if (planType === activeSubscription.planType) {
          return res.status(400).json({
            error: `You already have an active ${activeSubscription.planType} membership. You can only upgrade to a higher plan or renew after it expires.`,
            currentPlan: activeSubscription.planType,
            expiresAt: activeSubscription.endDate,
          });
        }

        if (requestedTier <= currentTier) {
          return res.status(400).json({
            error: `You currently have an active ${activeSubscription.planType} membership. Downgrading is not allowed while your subscription is active. You can upgrade to a higher plan.`,
            currentPlan: activeSubscription.planType,
            expiresAt: activeSubscription.endDate,
          });
        }
      }
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        planType,
        amount: Number(amount),
        paymentMethod,
        transactionId: transactionId || null,
        referenceNumber: referenceNumber.trim(),
        receiptUrl: receiptUrl || null,
        status: "pending",
      },
    });

    // Save receipt metadata if provided
    if (receiptUrl) {
      await prisma.paymentReceipt.create({
        data: {
          paymentId: payment.id,
          fileUrl: receiptUrl,
          fileType: receiptFileType || "image",
          fileSize: receiptFileSize ? Number(receiptFileSize) : null,
        },
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({ error: "Failed to create payment request" });
  }
};

// Get current user's payment history
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { userId };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ success: true, data: payments, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Get current user's wallet and active boosts
const getMyWallet = async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallet = await ensureWallet(userId);
    const activeBoost = await prisma.boost.findFirst({
      where: { userId, status: "active", endsAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    const contactCredits = await ensureContactCredits(userId);

    res.json({ success: true, data: { wallet, activeBoost, contactCredits } });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
};

// Admin: list pending + all payments with filters
const getAdminPayments = async (req, res) => {
  try {
    const { status, planType, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (planType) where.planType = planType;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
          subscription: { select: { id: true, planType: true, status: true, endDate: true } },
          boost: { select: { id: true, status: true, endsAt: true } },
          receipt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({ success: true, data: payments, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching admin payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Admin: approve a payment
const approvePayment = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { adminNote } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending") {
      return res.status(400).json({ error: `Payment is already ${payment.status}` });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "approved",
        verifiedAt: new Date(),
        verifiedBy: adminId,
        adminNote: adminNote || payment.adminNote,
      },
    });

    const activation = await activatePayment(updated, adminId);

    const config = await getPlanConfig(payment.planType);
    const planName = config?.name || payment.planType.charAt(0).toUpperCase() + payment.planType.slice(1);
    createNotification({
      userId: payment.userId,
      type: "payment",
      title: `${planName} Approved!`,
      body: `Congratulations! Your payment for ${planName} has been approved. Enjoy your benefits!`,
    }).catch((e) => console.error("Approval notification error:", e));

    emitPaymentStatus(payment.userId, { id: updated.id, status: "approved", planType: payment.planType, amount: payment.amount });

    await createAuditLog(
      adminId,
      "payment_approved",
      "payment",
      payment.id,
      { planType: payment.planType, amount: payment.amount, activation },
      req.ip
    );

    res.json({ success: true, data: { payment: updated, activation } });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Failed to approve payment" });
  }
};

// Admin: reject a payment
const rejectPayment = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { adminNote } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending") {
      return res.status(400).json({ error: `Payment is already ${payment.status}` });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: "rejected",
        verifiedAt: new Date(),
        verifiedBy: adminId,
        adminNote: adminNote || null,
      },
    });

    await createAuditLog(
      adminId,
      "payment_rejected",
      "payment",
      payment.id,
      { planType: payment.planType, amount: payment.amount, adminNote },
      req.ip
    );

    const config = await getPlanConfig(payment.planType);
    const planName = config?.name || payment.planType;
    createNotification({
      userId: payment.userId,
      type: "payment",
      title: "Payment Rejected",
      body: `Your payment for ${planName} was rejected. Reason: ${adminNote || "Please contact support for details."}`,
    }).catch((e) => console.error("Rejection notification error:", e));

    emitPaymentStatus(payment.userId, { id: updated.id, status: "rejected", planType: payment.planType, amount: payment.amount, adminNote });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    res.status(500).json({ error: "Failed to reject payment" });
  }
};

// Admin: get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [total, pending, approved, rejected, revenue] = await Promise.all([
      prisma.payment.count({ where: dateFilter }),
      prisma.payment.count({ where: { ...dateFilter, status: "pending" } }),
      prisma.payment.count({ where: { ...dateFilter, status: "approved" } }),
      prisma.payment.count({ where: { ...dateFilter, status: "rejected" } }),
      prisma.payment.aggregate({
        where: { ...dateFilter, status: "approved" },
        _sum: { amount: true },
      }),
    ]);

    const revenueByPlan = startDate && endDate
      ? await prisma.$queryRaw`
          SELECT plan_type, COUNT(*)::int as count, COALESCE(SUM(amount), 0) as revenue
          FROM payments
          WHERE status = 'approved'
            AND created_at >= ${new Date(startDate)}
            AND created_at <= ${new Date(endDate)}
          GROUP BY plan_type
        `
      : await prisma.$queryRaw`
          SELECT plan_type, COUNT(*)::int as count, COALESCE(SUM(amount), 0) as revenue
          FROM payments
          WHERE status = 'approved'
          GROUP BY plan_type
        `;

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        revenue: revenue._sum.amount || 0,
        revenueByPlan,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ error: "Failed to fetch payment statistics" });
  }
};

// Admin: list pending renewal reminders (subscriptions expiring soon)
const getRenewalReminders = async (req, res) => {
  try {
    const { days = 7, page = 1, limit = 20 } = req.query;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + Number(days));

    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: {
          status: "active",
          endDate: { lte: threshold, gte: new Date() },
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true },
          },
        },
        orderBy: { endDate: "asc" },
        skip,
        take: Number(limit),
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          endDate: { lte: threshold, gte: new Date() },
        },
      }),
    ]);

    res.json({ success: true, data: subscriptions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching renewal reminders:", error);
    res.status(500).json({ error: "Failed to fetch renewal reminders" });
  }
};

// Admin: verify a transaction/reference number — check for duplicates, fraud patterns
const verifyTransaction = async (req, res) => {
  try {
    const { ref } = req.params;
    const query = ref.trim();

    if (!query || query.length < 3) {
      return res.status(400).json({ error: "Search query must be at least 3 characters" });
    }

    // Search both referenceNumber and transactionId fields
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { referenceNumber: { contains: query, mode: "insensitive" } },
          { transactionId: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true, phone: true,
            profile: { select: { country: true, city: true, isProfileComplete: true } },
          },
        },
        subscription: { select: { id: true, planType: true, status: true, endDate: true } },
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Analyze for fraud indicators
    const flags = [];
    const exactMatches = payments.filter(
      (p) =>
        (p.referenceNumber && p.referenceNumber.toLowerCase() === query.toLowerCase()) ||
        (p.transactionId && p.transactionId.toLowerCase() === query.toLowerCase())
    );

    if (exactMatches.length > 1) {
      flags.push({
        type: "duplicate_reference",
        severity: "critical",
        message: `This reference number appears in ${exactMatches.length} payments — possible duplicate/fraud`,
      });
    }

    // Check for same reference, different users
    const uniqueUsers = new Set(exactMatches.map((p) => p.userId));
    if (uniqueUsers.size > 1) {
      flags.push({
        type: "multiple_users",
        severity: "critical",
        message: `Same reference number used by ${uniqueUsers.size} different users — likely fraud`,
      });
    }

    // Check for same reference, different amounts
    const amounts = new Set(exactMatches.map((p) => p.amount));
    if (amounts.size > 1) {
      flags.push({
        type: "amount_mismatch",
        severity: "warning",
        message: "Same reference number used with different amounts — verify carefully",
      });
    }

    // Check for already-approved payments with this reference
    const approvedWithRef = exactMatches.filter((p) => p.status === "approved");
    if (approvedWithRef.length > 0) {
      flags.push({
        type: "already_approved",
        severity: "warning",
        message: `${approvedWithRef.length} payment(s) with this reference already approved — verify this is not a reuse`,
      });
    }

    // Check for rejected payments with this reference
    const rejectedWithRef = exactMatches.filter((p) => p.status === "rejected");
    if (rejectedWithRef.length > 0) {
      flags.push({
        type: "previously_rejected",
        severity: "info",
        message: `${rejectedWithRef.length} payment(s) with this reference were previously rejected`,
      });
    }

    // Determine overall verdict
    let verdict = "not_found";
    let verdictLabel = "Not Found";
    let verdictColor = "gray";

    if (exactMatches.length === 0 && payments.length > 0) {
      verdict = "partial_match";
      verdictLabel = "Partial Match";
      verdictColor = "amber";
    } else if (exactMatches.length === 1) {
      const match = exactMatches[0];
      if (match.status === "approved") {
        verdict = "verified";
        verdictLabel = "Verified (Already Approved)";
        verdictColor = "green";
      } else if (match.status === "pending") {
        verdict = "pending";
        verdictLabel = "Found — Pending Verification";
        verdictColor = "blue";
      } else if (match.status === "rejected") {
        verdict = "rejected";
        verdictLabel = "Found — Previously Rejected";
        verdictColor = "red";
      }
    } else if (exactMatches.length > 1) {
      verdict = "suspicious";
      verdictLabel = "Suspicious — Multiple Uses";
      verdictColor = "red";
    }

    res.json({
      success: true,
      data: {
        query,
        verdict,
        verdictLabel,
        verdictColor,
        flags,
        totalMatches: payments.length,
        exactMatches: exactMatches.length,
        payments: payments.map((p) => ({
          id: p.id,
          status: p.status,
          planType: p.planType,
          amount: p.amount,
          currency: p.currency,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          transactionId: p.transactionId,
          receiptUrl: p.receiptUrl,
          adminNote: p.adminNote,
          verifiedAt: p.verifiedAt,
          verifiedBy: p.verifiedBy,
          createdAt: p.createdAt,
          user: p.user,
          subscription: p.subscription,
          receipt: p.receipt,
          isExactMatch:
            (p.referenceNumber && p.referenceNumber.toLowerCase() === query.toLowerCase()) ||
            (p.transactionId && p.transactionId.toLowerCase() === query.toLowerCase()),
        })),
      },
    });
  } catch (error) {
    console.error("Error verifying transaction:", error);
    res.status(500).json({ error: "Failed to verify transaction" });
  }
};

// User uploads a payment receipt file (stored separately — NEVER added to profile photos)
const uploadReceiptFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt file provided" });
    }
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    res.json({ success: true, receiptUrl, fileType: req.file.mimetype, fileSize: req.file.size });
  } catch (error) {
    console.error("Receipt upload error:", error);
    res.status(500).json({ error: "Failed to upload receipt" });
  }
};

module.exports = {
  createPaymentRequest,
  getMyPayments,
  getMyWallet,
  getAdminPayments,
  approvePayment,
  rejectPayment,
  getPaymentStats,
  getRenewalReminders,
  verifyTransaction,
  uploadReceiptFile,
  getPlanConfig,
  getValidPaymentMethodKeys,
};
