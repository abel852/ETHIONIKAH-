const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logAudit } = require("../utils/auditLogger");

// === USER MANAGEMENT ===
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { search, status, gender, isVerified, sortBy } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "active") where.isActive = true;
    else if (status === "suspended") where.isActive = false;
    if (gender) where.gender = gender;
    if (isVerified === "true") where.isVerified = true;
    else if (isVerified === "false") where.isVerified = false;

    let orderBy = { createdAt: "desc" };
    if (sortBy === "name") orderBy = { firstName: "asc" };
    else if (sortBy === "email") orderBy = { email: "asc" };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit, orderBy,
        include: {
          profile: { select: { country: true, city: true, isProfileComplete: true } },
          verification: { select: { status: true } },
          restrictions: { where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }, select: { id: true, type: true, reason: true, expiresAt: true, createdAt: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { profile: true, verification: true, restrictions: true, subscriptions: { orderBy: { createdAt: "desc" }, take: 1 }, payments: { orderBy: { createdAt: "desc" }, take: 10 }, sentMatches: { take: 5, orderBy: { createdAt: "desc" }, include: { matchedUser: { select: { id: true, firstName: true, lastName: true } } } } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    await logAudit({ adminId: req.user.id, action: "suspend_user", resource: "user", resourceId: req.params.id, details: { reason: req.body.reason } });
    res.json({ message: "User suspended" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.activateUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: true } });
    await logAudit({ adminId: req.user.id, action: "activate_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User activated" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    await logAudit({ adminId: req.user.id, action: "delete_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User deleted" });
  } catch (error) { res.status(500).json({ error: "Failed to delete user" }); }
};

exports.verifyUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true } });
    await prisma.verification.upsert({ where: { userId: req.params.id }, update: { status: "approved", adminId: req.user.id, reviewedAt: new Date() }, create: { userId: req.params.id, status: "approved", adminId: req.user.id, reviewedAt: new Date() } });
    await logAudit({ adminId: req.user.id, action: "verify_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User verified" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    await logAudit({ adminId: req.user.id, action: "reset_password", resource: "user", resourceId: req.params.id });
    res.json({ message: "Password reset" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.restrictUserChat = async (req, res) => {
  try {
    const { duration, reason } = req.body;
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
    const restriction = await prisma.userRestriction.create({ data: { userId: req.params.id, type: "chat_restrict", reason, duration, expiresAt, createdBy: req.user.id } });
    await logAudit({ adminId: req.user.id, action: "restrict_chat", resource: "user", resourceId: req.params.id, details: { duration, reason } });
    res.json({ restriction, message: "Chat restricted" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.restrictUserBan = async (req, res) => {
  try {
    const { reason } = req.body;
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    await prisma.userRestriction.create({ data: { userId: req.params.id, type: "ban", reason, createdBy: req.user.id } });
    await logAudit({ adminId: req.user.id, action: "ban_user", resource: "user", resourceId: req.params.id, details: { reason } });
    res.json({ message: "User banned" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.removeUserRestriction = async (req, res) => {
  try {
    const { type } = req.body;
    await prisma.userRestriction.deleteMany({ where: { userId: req.params.id, type } });
    await logAudit({ adminId: req.user.id, action: "remove_restriction", resource: "user", resourceId: req.params.id, details: { type } });
    res.json({ message: "Restriction removed" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.getUserRestrictions = async (req, res) => {
  try {
    const restrictions = await prisma.userRestriction.findMany({ where: { userId: req.params.id } });
    res.json({ restrictions });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === DASHBOARD ===
exports.getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalUsers, activeUsers, verifiedUsers, newUsersThisMonth, totalMatches, totalMessages, unreadMessages, totalRevenueAgg, revenueThisMonthAgg, pendingVerifications, openReports, openComplaints, activeSubscriptions, genderCounts, subscriptionPlans] = await Promise.all([
      prisma.user.count(), prisma.user.count({ where: { isActive: true } }), prisma.user.count({ where: { isVerified: true } }), prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.match.count({ where: { status: "accepted" } }), prisma.message.count(), prisma.message.count({ where: { isRead: false } }),
      prisma.payment.aggregate({ _sum: { amount: true } }), prisma.payment.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.verification.count({ where: { status: "pending" } }), prisma.report.count({ where: { status: { in: ["open", "investigating"] } } }), prisma.complaint.count({ where: { status: "open" } }), prisma.subscription.count({ where: { status: "active" } }),
      prisma.user.groupBy({ by: ["gender"], _count: true }), prisma.subscription.groupBy({ by: ["planType"], _count: true }),
    ]);
    const totalRevenue = totalRevenueAgg._sum.amount || 0;
    const revenueThisMonth = revenueThisMonthAgg._sum.amount || 0;
    const genderDistribution = [{ name: "Male", value: genderCounts.find((g) => g.gender === "male")?._count || 0 }, { name: "Female", value: genderCounts.find((g) => g.gender === "female")?._count || 0 }];
    const subscriptionBreakdown = subscriptionPlans.map((s) => ({ name: s.planType.charAt(0).toUpperCase() + s.planType.slice(1), value: s._count }));
    const recentUsers = await prisma.user.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, firstName: true, lastName: true, email: true, gender: true, isVerified: true, isActive: true, createdAt: true, profile: { select: { country: true, city: true } } } });
    const recentVerifications = await prisma.verification.findMany({ take: 5, orderBy: { reviewedAt: "desc" }, where: { reviewedAt: { not: null } }, select: { id: true, status: true, reviewedAt: true, user: { select: { id: true, firstName: true, lastName: true } }, admin: { select: { firstName: true, lastName: true } } } });
    const recentPayments = await prisma.payment.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, currency: true, status: true, createdAt: true, user: { select: { id: true, firstName: true, lastName: true } } } });
    const recentReports = await prisma.report.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, reason: true, status: true, createdAt: true, reporter: { select: { id: true, firstName: true, lastName: true } }, reportedUser: { select: { id: true, firstName: true, lastName: true } } } });
    const activities = [
      ...recentUsers.map((u) => ({ id: `user-${u.id}`, type: "user_registered", message: `${u.firstName} ${u.lastName} registered`, user: `${u.firstName} ${u.lastName}`, createdAt: u.createdAt })),
      ...recentVerifications.map((v) => ({ id: `ver-${v.id}`, type: "verification", message: `${v.user?.firstName || "User"}'s verification was ${v.status}`, user: v.admin ? `${v.admin.firstName} ${v.admin.lastName}` : "System", createdAt: v.reviewedAt })),
      ...recentPayments.map((p) => ({ id: `pay-${p.id}`, type: "payment", message: `${p.user?.firstName || "User"} made a payment of ${p.currency}${p.amount}`, user: p.user ? `${p.user.firstName} ${p.user.lastName}` : "User", createdAt: p.createdAt })),
      ...recentReports.map((r) => ({ id: `rep-${r.id}`, type: "report", message: `${r.reporter?.firstName || "User"} reported ${r.reportedUser?.firstName || "a user"}`, user: `${r.reporter?.firstName || "User"} ${r.reporter?.lastName || ""}`, createdAt: r.createdAt })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
    res.json({ dashboard: { stats: { totalUsers, activeUsers, verifiedUsers, newUsersThisMonth, totalMatches, totalMessages, unreadMessages, totalRevenue, revenueThisMonth, pendingVerifications, openReports, openComplaints, activeSubscriptions }, genderDistribution, subscriptionBreakdown, recentUsers, activities } });
  } catch (error) {
    console.error("Dashboard data error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const monthly = await prisma.user.groupBy({ by: ["createdAt"], _count: true });
    res.json({ analytics: { totalUsers, monthlyGrowth: monthly } });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const { type } = req.query;
    const where = {};
    if (type) where.type = type;
    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { admin: { select: { id: true, firstName: true, lastName: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ activities, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ error: "Failed to fetch activities" }); }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    res.json({ settings: map });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value, category: "general" } });
    res.json({ setting });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === ACTIVITY TIMELINE ===
exports.getActivityTimeline = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Admin logins today
    const adminLogins = await prisma.auditLog.findMany({
      where: { action: "admin_login", createdAt: { gte: todayStart } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { admin: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    // User logins today (lastLoginAt >= today)
    const userLoginsToday = await prisma.user.findMany({
      where: { lastLoginAt: { gte: todayStart } },
      select: { id: true, firstName: true, lastName: true, email: true, lastLoginAt: true },
      orderBy: { lastLoginAt: "desc" },
      take: 100,
    });

    // Registrations by hour today
    const registrationsToday = await prisma.user.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { createdAt: true },
    });
    const regByHour = hours.map((h) => ({ hour: h, count: 0 }));
    registrationsToday.forEach((u) => { const h = u.createdAt.getHours(); regByHour[h].count++; });
    const totalRegistrationsToday = registrationsToday.length;

    // Verifications by hour today
    const verificationsToday = await prisma.verification.findMany({
      where: { reviewedAt: { gte: todayStart } },
      select: { reviewedAt: true, status: true },
    });
    const verByHour = hours.map((h) => ({ hour: h, count: 0 }));
    verificationsToday.forEach((v) => { if (v.reviewedAt) { const h = v.reviewedAt.getHours(); verByHour[h].count++; } });
    const totalVerificationsToday = verificationsToday.length;
    const verifiedToday = verificationsToday.filter((v) => v.status === "approved").length;
    const rejectedToday = verificationsToday.filter((v) => v.status === "rejected").length;

    // Daily stats for last 30 days
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const [regs, vers, logins] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: day, lt: nextDay } } }),
        prisma.verification.count({ where: { reviewedAt: { gte: day, lt: nextDay } } }),
        prisma.user.count({ where: { lastLoginAt: { gte: day, lt: nextDay } } }),
      ]);
      dailyStats.push({ date: day.toISOString().split("T")[0], registrations: regs, verifications: vers, logins });
    }

    // Total counts
    const totalUsers = await prisma.user.count();
    const totalVerified = await prisma.user.count({ where: { isVerified: true } });

    res.json({
      timeline: {
        adminLogins,
        userLogins: userLoginsToday,
        registrationsByHour: regByHour,
        totalRegistrationsToday,
        verificationsByHour: verByHour,
        totalVerificationsToday,
        verifiedToday,
        rejectedToday,
        dailyStats,
        totals: { users: totalUsers, verified: totalVerified },
      },
    });
  } catch (error) {
    console.error("Activity timeline error:", error);
    res.status(500).json({ error: "Failed to fetch activity timeline" });
  }
};

// === AUDIT LOGS ===
exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { action, resource, adminId } = req.query;
    const where = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (adminId) where.adminId = adminId;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { admin: { select: { id: true, firstName: true, lastName: true, email: true } } } }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { res.status(500).json({ error: "Failed to fetch audit logs" }); }
};

exports.getAuditActions = async (req, res) => {
  try {
    const actions = await prisma.auditLog.groupBy({ by: ["action"], _count: true });
    const resources = await prisma.auditLog.groupBy({ by: ["resource"], _count: true });
    res.json({ actions: actions.map((a) => ({ name: a.action, count: a._count })), resources: resources.map((r) => ({ name: r.resource, count: r._count })) });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === FEATURE TOGGLES ===
exports.getFeatureToggles = async (req, res) => {
  try {
    const toggles = await prisma.featureToggle.findMany({ orderBy: { category: "asc" } });
    res.json({ toggles });
  } catch (error) { res.status(500).json({ error: "Failed to fetch feature toggles" }); }
};

exports.updateFeatureToggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const toggle = await prisma.featureToggle.update({ where: { id }, data: { enabled } });
    await logAudit({ adminId: req.user.id, action: "toggle_feature", resource: "feature_toggle", resourceId: id, details: { key: toggle.key, enabled } });
    res.json({ toggle });
  } catch (error) { res.status(500).json({ error: "Failed to update feature toggle" }); }
};

// === RBAC ===
exports.getAdminPermissions = async (req, res) => {
  try {
    const permissions = await prisma.adminPermission.findMany({ include: { admin: { select: { id: true, firstName: true, lastName: true, email: true } } } });
    res.json({ permissions });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.setAdminPermission = async (req, res) => {
  try {
    const { adminId, permission } = req.body;
    const perm = await prisma.adminPermission.create({ data: { adminId, permission } });
    await logAudit({ adminId: req.user.id, action: "grant_permission", resource: "admin_permission", details: { targetAdminId: adminId, permission } });
    res.json({ permission: perm });
  } catch (error) {
    if (error.code === "P2002") return res.status(400).json({ error: "Permission already exists" });
    res.status(500).json({ error: "Failed" });
  }
};

exports.removeAdminPermission = async (req, res) => {
  try {
    const { adminId, permission } = req.body;
    await prisma.adminPermission.delete({ where: { adminId_permission: { adminId, permission } } });
    await logAudit({ adminId: req.user.id, action: "revoke_permission", resource: "admin_permission", details: { targetAdminId: adminId, permission } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === CONTENT FLAGS ===
exports.getContentFlags = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const flags = await prisma.contentFlag.findMany({ where, orderBy: { createdAt: "desc" }, include: { flaggedBy: { select: { id: true, firstName: true, lastName: true } }, reviewer: { select: { id: true, firstName: true, lastName: true } } } });
    res.json({ flags });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.reviewContentFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const flag = await prisma.contentFlag.update({ where: { id }, data: { status, adminNote, reviewedBy: req.user.id, reviewedAt: new Date() } });
    await logAudit({ adminId: req.user.id, action: `content_${status}`, resource: "content_flag", resourceId: id, details: { targetType: flag.targetType, adminNote } });
    res.json({ flag });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === AFFILIATES & PROMOTIONS ===
exports.getAffiliateReferrals = async (req, res) => {
  try {
    const referrals = await prisma.affiliateReferral.findMany({ orderBy: { createdAt: "desc" }, include: { referrer: { select: { id: true, firstName: true, lastName: true, email: true } }, referred: { select: { id: true, firstName: true, lastName: true, email: true } } } });
    const stats = { total: referrals.length, converted: referrals.filter((r) => r.status === "converted").length, rewarded: referrals.filter((r) => r.status === "rewarded").length, totalRewards: referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0) };
    res.json({ referrals, stats });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ promotions });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.createPromotion = async (req, res) => {
  try {
    const promo = await prisma.promotion.create({ data: req.body });
    await logAudit({ adminId: req.user.id, action: "create_promotion", resource: "promotion", resourceId: promo.id, details: { code: promo.code } });
    res.json({ promotion: promo });
  } catch (error) {
    if (error.code === "P2002") return res.status(400).json({ error: "Code already exists" });
    res.status(500).json({ error: "Failed" });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await prisma.promotion.update({ where: { id }, data: req.body });
    res.json({ promotion: promo });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === NOTIFICATION TEMPLATES ===
exports.getNotificationTemplates = async (req, res) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({ orderBy: { key: "asc" } });
    res.json({ templates });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.updateNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.notificationTemplate.update({ where: { id }, data: req.body });
    await logAudit({ adminId: req.user.id, action: "update_template", resource: "notification_template", resourceId: id });
    res.json({ template });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === GDPR ===
exports.getGDPRRequests = async (req, res) => {
  try {
    const requests = await prisma.complaint.findMany({ where: { subject: { contains: "GDPR", mode: "insensitive" } }, orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } });
    const pendingDeletions = await prisma.user.count({ where: { isActive: false, updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } });
    const totalUsers = await prisma.user.count();
    const inactiveUsers = await prisma.user.count({ where: { isActive: false } });
    res.json({ requests, stats: { pendingDeletionRequests: requests.filter((r) => r.status === "open").length, pendingDeletions, totalUsers, inactiveUsers, retentionDays: 30 } });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === RETENTION ===
exports.getRetentionMetrics = async (req, res) => {
  try {
    const now = new Date();
    const daily = await prisma.user.count({ where: { lastLoginAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } } });
    const weekly = await prisma.user.count({ where: { lastLoginAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } });
    const monthly = await prisma.user.count({ where: { lastLoginAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } } });
    const total = await prisma.user.count();
    res.json({ retention: { daily, weekly, monthly, total }, rates: { daily: total ? ((daily / total) * 100).toFixed(1) : 0, weekly: total ? ((weekly / total) * 100).toFixed(1) : 0, monthly: total ? ((monthly / total) * 100).toFixed(1) : 0 } });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === USER FUNNEL ===
exports.getUserFunnel = async (req, res) => {
  try {
    const total = await prisma.user.count();
    const withProfile = await prisma.profile.count();
    const verified = await prisma.user.count({ where: { isVerified: true } });
    const matched = await prisma.match.count({ where: { status: "accepted" }, distinct: ["userId"] });
    const subscriptions = await prisma.subscription.count({ where: { status: "active" } });
    const totalMatches = await prisma.match.count({ where: { status: "accepted" } });
    res.json({ funnel: { signups: total, profileCompleted: withProfile, verified, matched, subscribed: subscriptions, married: 0 }, rates: { signupToProfile: total ? ((withProfile / total) * 100).toFixed(1) : 0, profileToVerified: withProfile ? ((verified / withProfile) * 100).toFixed(1) : 0, verifiedToMatched: verified ? ((matched / verified) * 100).toFixed(1) : 0 }, totalMatches });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === ENGAGEMENT HEATMAP ===
exports.getEngagementHeatmap = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({ select: { createdAt: true }, where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } });
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = days.map((day) => ({ day, count: 0 }));
    messages.forEach((m) => { hours[m.createdAt.getHours()].count++; dayCounts[m.createdAt.getDay()].count++; });
    res.json({ heatmap: { hours, days: dayCounts } });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === SUSPICIOUS ACTIVITY ===
exports.getSuspiciousActivity = async (req, res) => {
  try {
    const recentUsers = await prisma.user.findMany({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, firstName: true, lastName: true, email: true, isVerified: true, createdAt: true } });
    const flaggedIPs = await prisma.auditLog.groupBy({ by: ["ipAddress"], _count: true, where: { ipAddress: { not: null } }, orderBy: { _count: { ipAddress: "desc" } }, take: 20 });
    const highVolumeSenders = await prisma.message.groupBy({ by: ["senderId"], _count: true, orderBy: { _count: { senderId: "desc" } }, take: 10 });
    res.json({ flags: { rapidRegistrations: recentUsers.length, suspiciousIPs: flaggedIPs.map((i) => ({ ip: i.ipAddress, count: i._count })), topMessageSenders: highVolumeSenders.map((s) => ({ userId: s.senderId, count: s._count })) } });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === COMPLIANCE ===
exports.getComplianceChecks = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({ take: 50, orderBy: { updatedAt: "desc" }, include: { user: { select: { id: true, firstName: true, lastName: true, isVerified: true } } } });
    const issues = profiles.filter((p) => p.bio && (p.bio.toLowerCase().includes("inappropriate") || p.bio.length > 2000)).map((p) => ({ id: p.id, userId: p.userId, user: p.user, field: "bio", issue: "Bio may contain non-compliant content" }));
    res.json({ checks: issues, total: issues.length });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

// === SEED ===
exports.seedDefaults = async (req, res) => {
  try {
    const defaults = [
      { key: "chat_enabled", label: "Chat System", description: "Enable or disable the messaging system", category: "features" },
      { key: "premium_filters", label: "Premium Filters", description: "Enable premium search filters", category: "features" },
      { key: "ai_moderation", label: "AI Moderation", description: "Auto-flag inappropriate content", category: "moderation" },
      { key: "affiliate_program", label: "Affiliate Program", description: "Enable affiliate/referral program", category: "growth" },
      { key: "wali_oversight", label: "Wali Oversight", description: "Enable guardian/wali involvement features", category: "community" },
    ];
    for (const d of defaults) {
      await prisma.featureToggle.upsert({ where: { key: d.key }, update: {}, create: d });
    }
    const templates = [
      { key: "welcome_email", type: "email", subject: "Welcome to Ethio Nikah", body: "Assalamu Alaikum {{name}}, welcome to Ethio Nikah!", variables: ["name"] },
      { key: "verification_approved", type: "email", subject: "Verification Approved", body: "Your account has been verified.", variables: ["name"] },
      { key: "password_reset", type: "email", subject: "Reset Your Password", body: "Click here to reset your password: {{link}}", variables: ["link"] },
      { key: "match_notification", type: "push", subject: "New Match", body: "You have a new match!", variables: [] },
    ];
    for (const t of templates) {
      await prisma.notificationTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
    }
    const settings = [
      { key: "site_name", value: "Ethio Nikah", category: "branding" },
      { key: "primary_color", value: "#D4AF37", category: "branding" },
      { key: "logo_url", value: "/images/logo.png", category: "branding" },
      { key: "default_language", value: "en", category: "localization" },
      { key: "data_retention_days", value: 30, category: "privacy" },
    ];
    for (const s of settings) {
      await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value, category: s.category } });
    }
    res.json({ success: true, message: "Default data seeded" });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Failed to seed defaults" });
  }
};
