const prisma = require("../config/database");
const { getPlanConfig } = require("./paymentController");

// Get all subscriptions with filters
const getAllSubscriptions = async (req, res) => {
  try {
    const { status, planType, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (planType) where.planType = planType;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscriptions" });
  }
};

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await       prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
};

// Get user's subscription
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
};

// Create subscription
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planType, paymentMethod, transactionId } = req.body;

    // Fetch plan config from DB
    const config = await getPlanConfig(planType);
    if (!config) {
      return res.status(400).json({ success: false, error: "Invalid plan type" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (config.durationDays > 0) {
      endDate.setDate(endDate.getDate() + config.durationDays);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        planType,
        amount: config.price,
        currency: "Birr",
        status: "approved",
        paymentMethod,
        transactionId,
      },
    });

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        status: "active",
        startDate,
        endDate: config.durationDays > 0 ? endDate : null,
        paymentId: payment.id,
      },
      include: { payments: true },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, error: "Failed to create subscription" });
  }
};

// Update subscription status (admin only — user route uses cancelSubscription)
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autoRenew } = req.body;
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    // For non-admin users, verify ownership before updating
    if (!isAdmin) {
      const existing = await prisma.subscription.findUnique({ where: { id }, select: { userId: true } });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Subscription not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, error: "You can only modify your own subscription" });
      }
    }

    const allowedStatusUpdate = isAdmin ? status : undefined;
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(allowedStatusUpdate && { status: allowedStatusUpdate }),
        ...(autoRenew !== undefined && { autoRenew }),
      },
      include: { payments: true },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ success: false, error: "Failed to update subscription" });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    // For non-admin users, verify ownership before cancelling
    if (!isAdmin) {
      const existing = await prisma.subscription.findUnique({ where: { id }, select: { userId: true } });
      if (!existing) {
        return res.status(404).json({ success: false, error: "Subscription not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, error: "You can only cancel your own subscription" });
      }
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: "cancelled",
        autoRenew: false,
        endDate: new Date(),
      },
      include: { payments: true },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ success: false, error: "Failed to cancel subscription" });
  }
};

// Get revenue statistics
const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [totalRevenue, activeSubscriptions, premiumSubscriptions, basicSubscriptions] = await Promise.all([
      prisma.payment.aggregate({
        where: { ...where, status: "approved" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.subscription.count({
        where: { status: "active", planType: "platinum" },
      }),
      prisma.subscription.count({
        where: { status: "active", planType: "gold" },
      }),
    ]);

    // Revenue by plan (only approved payments)
    const revenueByPlan = await prisma.$queryRaw`
      SELECT 
        s.plan_type,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM subscriptions s
      LEFT JOIN payments p ON p.subscription_id = s.id AND p.status = 'approved'
      WHERE s.status = 'active'
      GROUP BY s.plan_type
    `;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        totalPayments: totalRevenue._count,
        activeSubscriptions,
        premiumSubscriptions,
        basicSubscriptions,
        revenueByPlan,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch revenue statistics" });
  }
};

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          subscription: true,
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  getUserSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  getRevenueStats,
  getAllPayments,
};
