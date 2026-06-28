const prisma = require("../config/database");

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
      include: { payment: true },
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

    // Calculate end date based on plan type
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (planType === "premium") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === "basic") {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: planType === "premium" ? 500 : 200,
        currency: "ETB",
        status: "completed",
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
        endDate,
        paymentId: payment.id,
      },
      include: { payment: true },
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, error: "Failed to create subscription" });
  }
};

// Update subscription status
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autoRenew } = req.body;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(autoRenew !== undefined && { autoRenew }),
      },
      include: { payment: true },
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

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: "cancelled",
        autoRenew: false,
        endDate: new Date(),
      },
      include: { payment: true },
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
        where: { ...where, status: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.subscription.count({
        where: { status: "active", planType: "premium" },
      }),
      prisma.subscription.count({
        where: { status: "active", planType: "basic" },
      }),
    ]);

    // Revenue by plan
    const revenueByPlan = await prisma.$queryRaw`
      SELECT 
        s.plan_type,
        COUNT(*) as count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM subscriptions s
      LEFT JOIN payments p ON p.subscription_id = s.id
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
