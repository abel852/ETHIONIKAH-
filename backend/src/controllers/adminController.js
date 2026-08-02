const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logAudit } = require("../utils/auditLogger");
const { autoRevokeWaliInvitation } = require("../utils/waliRevoke");
const { createNotification } = require("../utils/notification");
const { emitNewMessage } = require("../utils/messageSocket");
const { invalidateWeightsCache } = require("./matchController");

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
    else if (status === "flagged") where.isFlaggedForReview = true;
    else if (status === "locked") where.OR = [{ loginPermanentlyLocked: true }, { loginLockedUntil: { gte: new Date() } }];
    else if (status === "pinned") where.adminPinned = true;
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
          verification: { select: { status: true, idDocumentPath: true, selfiePath: true } },
          restrictions: { where: { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }, select: { id: true, type: true, reason: true, expiresAt: true, createdAt: true } },
          subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, planType: true, endDate: true, status: true } },
        },
        // Lockout + flag fields are on the User model, returned automatically
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

const BAD_WORDS = ["sex", "fuck", "bitch", "nigga", "whore", "slut", "porn", "cock", "dick", "cunt", "bastard", "asshole"];

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, gender: true, dateOfBirth: true, isActive: true, isVerified: true, isPhoneVerified: true, isEmailVerified: true, lastLoginAt: true, createdAt: true, updatedAt: true, role: true, profile: true, verification: true, restrictions: true, subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, planType: true, endDate: true, status: true } } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const adminIds = (await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    })).map((a) => a.id);

    const [sentMessages, receivedMessages] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId, receiverId: { notIn: adminIds } },
        select: { receiverId: true, content: true },
      }),
      prisma.message.findMany({
        where: { receiverId: userId, senderId: { notIn: adminIds } },
        select: { senderId: true },
      }),
    ]);

    const chatPartnerIds = new Set();
    sentMessages.forEach((m) => chatPartnerIds.add(m.receiverId));
    receivedMessages.forEach((m) => chatPartnerIds.add(m.senderId));

    const badWordPattern = new RegExp(`\\b(${BAD_WORDS.join("|")})\\b`, "gi");
    let badWordTotal = 0;
    const wordCounts = {};
    for (const m of sentMessages) {
      const matches = m.content.match(badWordPattern);
      if (matches) {
        badWordTotal += matches.length;
        for (const w of matches) {
          const key = w.toLowerCase();
          wordCounts[key] = (wordCounts[key] || 0) + 1;
        }
      }
    }

    res.json({
      user,
      stats: {
        lastLoginAt: user.lastLoginAt,
        chatPartners: chatPartnerIds.size,
        badWordTotal,
        badWordDetails: wordCounts,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    try { require("../middleware/auth").invalidateAuthCache(req.params.id); } catch {}
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "suspend_user", resource: "user", resourceId: req.params.id, details: { reason: req.body.reason } });
    res.json({ message: "User suspended" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.activateUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: true } });
    try { require("../middleware/auth").invalidateAuthCache(req.params.id); } catch {}
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "activate_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User activated" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.userId;

    // Soft-delete the user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId,
        isActive: false,
      },
    });
    try { require("../middleware/auth").invalidateAuthCache(userId); } catch {}

    // Expire all pending partnership requests SENT BY the deleted user
    const sentRequests = await prisma.exclusivePartnershipRequest.findMany({
      where: { requesterId: userId, status: "pending" },
      select: { id: true, receiverId: true },
    });
    if (sentRequests.length > 0) {
      await prisma.exclusivePartnershipRequest.updateMany({
        where: { id: { in: sentRequests.map((r) => r.id) } },
        data: { status: "expired", respondedAt: new Date() },
      });
      for (const r of sentRequests) {
        createNotification({ userId: r.receiverId, type: "exclusive_partnership_expired", title: "Partnership Request Expired", body: "A partnership request sent to you has expired." }).catch(() => {});
      }
    }

    // Expire all pending partnership requests RECEIVED BY the deleted user
    const receivedRequests = await prisma.exclusivePartnershipRequest.findMany({
      where: { receiverId: userId, status: "pending" },
      select: { id: true, requesterId: true },
    });
    if (receivedRequests.length > 0) {
      await prisma.exclusivePartnershipRequest.updateMany({
        where: { id: { in: receivedRequests.map((r) => r.id) } },
        data: { status: "expired", respondedAt: new Date() },
      });
      for (const r of receivedRequests) {
        createNotification({ userId: r.requesterId, type: "exclusive_partnership_expired", title: "Partnership Request Expired", body: "Your partnership request has expired because the recipient is no longer available." }).catch(() => {});
      }
    }

    // End any active exclusive partnership
    const activePartnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: userId, status: "active" },
          { userBId: userId, status: "active" },
        ],
      },
      select: { id: true, userAId: true, userBId: true },
    });
    if (activePartnership) {
      await prisma.exclusivePartnership.update({
        where: { id: activePartnership.id },
        data: { status: "ended", endedAt: new Date() },
      });
      const otherUserId = activePartnership.userAId === userId ? activePartnership.userBId : activePartnership.userAId;

      createNotification({ userId: otherUserId, type: "exclusive_partnership_ended", title: "Exclusive Marriage Process Ended", body: "The exclusive marriage process has been ended because your partner is no longer available." }).catch(() => {});

      // Auto-revoke any active or pending Wali invitation
      await autoRevokeWaliInvitation(activePartnership.id, "user_soft_deleted", adminId);
    }

    await logAudit({ actorId, actorType: "ADMIN", action: "delete_user", resource: "user", resourceId: userId, details: { method: "soft_delete" } });
    res.json({ message: "User soft-deleted — all historical records preserved" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true } });
    await prisma.verification.upsert({ where: { userId: req.params.id }, update: { status: "approved", adminId: req.user.userId, reviewedAt: new Date() }, create: { userId: req.params.id, status: "approved", adminId: req.user.userId, reviewedAt: new Date() } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "verify_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User verified" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.rejectUserVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    await prisma.verification.updateMany({ where: { userId: req.params.id, status: "pending" }, data: { status: "rejected", adminId: req.user.userId, adminNote: reason || null, reviewedAt: new Date() } });
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: false } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "reject_verification", resource: "user", resourceId: req.params.id, details: { reason } });
    res.json({ message: "Verification rejected" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: "Password must contain at least one uppercase letter" });
    if (!/[a-z]/.test(newPassword)) return res.status(400).json({ error: "Password must contain at least one lowercase letter" });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: "Password must contain at least one number" });
    if (!/[^A-Za-z0-9]/.test(newPassword)) return res.status(400).json({ error: "Password must contain at least one symbol (e.g. !@#$%)" });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash, tokenVersion: { increment: 1 } } });
    try { require("../middleware/auth").invalidateAuthCache(req.params.id); } catch {}
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "reset_password", resource: "user", resourceId: req.params.id });
    res.json({ message: "Password reset" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.restrictUserChat = async (req, res) => {
  try {
    const { duration, reason } = req.body;
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
    const restriction = await prisma.userRestriction.create({ data: { userId: req.params.id, type: "chat_restrict", reason, duration, expiresAt, createdBy: req.user.userId } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "restrict_chat", resource: "user", resourceId: req.params.id, details: { duration, reason } });
    res.json({ restriction, message: "Chat restricted" });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.restrictUserBan = async (req, res) => {
  try {
    const { reason, durationInDays } = req.body;
    const existing = await prisma.userRestriction.findFirst({ where: { userId: req.params.id, type: "ban", OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] } });
    if (existing) return res.status(400).json({ error: "User is already banned" });
    const duration = durationInDays ? durationInDays * 24 * 60 : null;
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { firstName: true } });
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    try { require("../middleware/auth").invalidateAuthCache(req.params.id); } catch {}
    await prisma.userRestriction.create({ data: { userId: req.params.id, type: "ban", reason, duration, expiresAt, createdBy: req.user.userId } });

    const isPermanent = !durationInDays;

    if (isPermanent) {
      // --- PERMANENT BAN: terminate all partnership relationships ---

      // Expire all pending partnership requests SENT BY the banned user
      const sentRequests = await prisma.exclusivePartnershipRequest.findMany({
        where: { requesterId: req.params.id, status: "pending" },
        select: { id: true, receiverId: true },
      });
      if (sentRequests.length > 0) {
        await prisma.exclusivePartnershipRequest.updateMany({
          where: { id: { in: sentRequests.map((r) => r.id) } },
          data: { status: "expired", respondedAt: new Date() },
        });
        for (const r of sentRequests) {
          createNotification({ userId: r.receiverId, type: "exclusive_partnership_expired", title: "Partnership Request Expired", body: "A partnership request sent to you has expired." }).catch(() => {});
        }
      }

      // Expire all pending partnership requests RECEIVED BY the banned user
      const receivedRequests = await prisma.exclusivePartnershipRequest.findMany({
        where: { receiverId: req.params.id, status: "pending" },
        select: { id: true, requesterId: true },
      });
      if (receivedRequests.length > 0) {
        await prisma.exclusivePartnershipRequest.updateMany({
          where: { id: { in: receivedRequests.map((r) => r.id) } },
          data: { status: "expired", respondedAt: new Date() },
        });
        for (const r of receivedRequests) {
          createNotification({ userId: r.requesterId, type: "exclusive_partnership_expired", title: "Partnership Request Expired", body: "Your partnership request has expired because the recipient is no longer available." }).catch(() => {});
        }
      }

      // End any active exclusive partnership
      const activePartnership = await prisma.exclusivePartnership.findFirst({
        where: {
          OR: [
            { userAId: req.params.id, status: "active" },
            { userBId: req.params.id, status: "active" },
          ],
        },
        select: { id: true, userAId: true, userBId: true },
      });
      if (activePartnership) {
        await prisma.exclusivePartnership.update({
          where: { id: activePartnership.id },
          data: { status: "ended", endedAt: new Date() },
        });
        const otherUserId = activePartnership.userAId === req.params.id ? activePartnership.userBId : activePartnership.userAId;

        createNotification({ userId: otherUserId, type: "exclusive_partnership_ended", title: "Exclusive Marriage Process Ended", body: "The exclusive marriage process has been ended because your partner is no longer available." }).catch(() => {});

        // Auto-revoke any active or pending Wali invitation
        await autoRevokeWaliInvitation(activePartnership.id, "user_banned", req.user.userId);
      }
    }
    // TEMPORARY BAN: no partnership changes — messaging and partnership actions
    // are frozen via isActive=false. When suspension ends, everything resumes.

    const expiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : null;
    const message = expiryDate ? `Your account has been temporarily suspended. You will regain access on ${expiryDate}.` : "Your account has been permanently suspended.";
    createNotification({ userId: req.params.id, type: "account", title: "Account Suspended", body: message }).catch(() => {});
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "ban_user", resource: "user", resourceId: req.params.id, details: { reason, durationInDays } });
    res.json({ message: "User banned", expiresAt });
  } catch (error) { res.status(500).json({ error: "Failed" }); }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { isActive: true, role: true } });
    if (!user) return res.status(404).json({ error: "User not found" });
    await prisma.userRestriction.deleteMany({ where: { userId: req.params.id, type: "ban" } });
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: true } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "unban_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "User unbanned" });
  } catch (error) { res.status(500).json({ error: "Failed to unban" }); }
};

exports.removeUserRestriction = async (req, res) => {
  try {
    const { type } = req.body;
    await prisma.userRestriction.deleteMany({ where: { userId: req.params.id, type } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "remove_restriction", resource: "user", resourceId: req.params.id, details: { type } });
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
      prisma.payment.aggregate({ where: { status: "approved" }, _sum: { amount: true } }), prisma.payment.aggregate({ where: { status: "approved", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
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
    const now = new Date();

    // Build last 6 months labels and date boundaries
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({
        label: d.toLocaleString("en-US", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        start: d,
        end,
      });
    }

    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [
      totalUsers, activeUsers, verifiedUsers, pendingVerifications,
      totalMatches, totalReports, totalMessages, unreadMessages,
      openComplaints, newUsersThisMonth, suspendedUsers, bannedUsers,
      maleUsers, femaleUsers, totalSubscriptions, activeSubscriptions,
      totalPayments, pendingPayments, approvedPayments, rejectedPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "user", deletedAt: null } }),
      prisma.user.count({ where: { role: "user", isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: "user", isVerified: true, deletedAt: null } }),
      prisma.verification.count({ where: { status: "pending" } }),
      prisma.match.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.message.count(),
      prisma.message.count({ where: { isRead: false } }),
      prisma.complaint.count({ where: { status: "open" } }),
      prisma.user.count({ where: { role: "user", createdAt: { gte: monthAgo }, deletedAt: null } }),
      prisma.userRestriction.count({ where: { type: "suspend" } }),
      prisma.userRestriction.count({ where: { type: "ban" } }),
      prisma.user.count({ where: { role: "user", gender: "male", deletedAt: null } }),
      prisma.user.count({ where: { role: "user", gender: "female", deletedAt: null } }),
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: "pending" } }),
      prisma.payment.count({ where: { status: "approved" } }),
      prisma.payment.count({ where: { status: "rejected" } }),
    ]);

    // Monthly time-series data
    const [monthlyUsers, monthlyMatches, monthlyRevenue] = await Promise.all([
      Promise.all(
        months.map(async (m) => {
          const count = await prisma.user.count({
            where: {
              role: "user",
              deletedAt: null,
              createdAt: { gte: m.start, lt: m.end },
            },
          });
          return { month: m.label, users: count };
        })
      ),
      Promise.all(
        months.map(async (m) => {
          const count = await prisma.match.count({
            where: { createdAt: { gte: m.start, lt: m.end } },
          });
          return { month: m.label, matches: count };
        })
      ),
      Promise.all(
        months.map(async (m) => {
          let amount = 0;
          try {
            const result = await prisma.payment.aggregate({
              where: {
                status: "approved",
                createdAt: { gte: m.start, lt: m.end },
              },
              _sum: { amount: true },
            });
            amount = result._sum.amount || 0;
          } catch {}
          return { month: m.label, revenue: amount };
        })
      ),
    ]);

    // Merge monthly data into a single array for the frontend
    const monthlyData = months.map((m, i) => ({
      month: m.label,
      users: monthlyUsers[i]?.users || 0,
      matches: monthlyMatches[i]?.matches || 0,
      revenue: monthlyRevenue[i]?.revenue || 0,
    }));

    let totalRevenue = 0;
    try {
      const revenueResult = await prisma.payment.aggregate({
        where: { status: "approved" },
        _sum: { amount: true },
      });
      totalRevenue = revenueResult._sum.amount || 0;
    } catch {}

    res.json({
      analytics: {
        totalUsers, activeUsers, verifiedUsers, pendingVerifications,
        totalMatches, totalReports, totalMessages, unreadMessages,
        openComplaints, newUsersThisMonth, totalRevenue,
        suspendedUsers, bannedUsers,
        genderDistribution: { male: maleUsers, female: femaleUsers },
        subscriptionStats: { total: totalSubscriptions, active: activeSubscriptions },
        paymentStats: {
          total: totalPayments, pending: pendingPayments,
          approved: approvedPayments, rejected: rejectedPayments,
        },
        monthlyData,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const { type } = req.query;
    const where = {};
    if (type) where.type = type;
    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { actor: { select: { id: true, firstName: true, lastName: true } } } }),
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
    const { key, value, category } = req.body;
    const cat = category || "general";
    const setting = await prisma.systemSetting.upsert({ where: { key }, update: { value, category: cat }, create: { key, value, category: cat } });
    if (key.startsWith("matchmaking_weight_")) {
      invalidateWeightsCache();
    }
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "update_setting", resource: "system_setting", resourceId: key, details: { key, value, category: cat } });
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
      include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
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
    if (adminId) where.actorId = adminId;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } } }),
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
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "toggle_feature", resource: "feature_toggle", resourceId: id, details: { key: toggle.key, enabled } });
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
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "grant_permission", resource: "admin_permission", details: { targetAdminId: adminId, permission } });
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
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "revoke_permission", resource: "admin_permission", details: { targetAdminId: adminId, permission } });
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
    const flag = await prisma.contentFlag.update({ where: { id }, data: { status, adminNote, reviewedBy: req.user.userId, reviewedAt: new Date() } });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: `content_${status}`, resource: "content_flag", resourceId: id, details: { targetType: flag.targetType, adminNote } });
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
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "create_promotion", resource: "promotion", resourceId: promo.id, details: { code: promo.code } });
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
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "update_template", resource: "notification_template", resourceId: id });
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

// === ADMIN MESSAGING ===
exports.sendUserMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const receiverId = req.params.id;
    if (!content) return res.status(400).json({ error: "Message content is required" });
    const message = await prisma.message.create({
      data: { senderId: req.user.userId, receiverId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await createNotification({ userId: receiverId, type: "admin_message", title: "New message from admin", body: content });
    emitNewMessage(message, receiverId);
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "send_message", resource: "user", resourceId: receiverId });
    res.status(201).json({ message });
  } catch (error) {
    console.error("Admin send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// === ADMIN BROADCAST NOTIFICATION ===
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, body, gender } = req.body;
    if (!title || !body) return res.status(400).json({ error: "Title and body are required" });
    const where = gender && gender !== "both" ? { gender } : {};
    const users = await prisma.user.findMany({ where, select: { id: true } });
    if (!users.length) return res.status(400).json({ error: "No users match the selected gender" });
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type: "admin_broadcast", title, body })),
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "broadcast_notification", resource: "all_users", details: { gender: gender || "all" } });
    res.json({ message: `Notification sent to ${users.length} user(s)` });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(500).json({ error: "Failed to broadcast" });
  }
};

// === ADMIN TARGETED NOTIFICATION ===
exports.notifyUser = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: "Title and body are required" });
    await prisma.notification.create({
      data: { userId: req.params.id, type: "admin_reminder", title, body },
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "notify_user", resource: "user", resourceId: req.params.id });
    res.json({ message: "Notification sent" });
  } catch (error) {
    console.error("Notify user error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
};

// === BADGE COUNTS ===
exports.getBadgeCounts = async (req, res) => {
  try {
    const [pendingVerifications, openComplaints, openReports, pendingAffiliates, pendingPayments, suspendedUsers] = await Promise.all([
      prisma.verification.count({ where: { status: "pending", viewed_at: null } }),
      prisma.complaint.count({ where: { status: "open", viewed_at: null } }),
      prisma.report.count({ where: { status: { in: ["open", "investigating"] }, viewed_at: null } }),
      prisma.affiliateReferral.count({ where: { status: "pending" } }).catch(() => 0),
      prisma.payment.count({ where: { status: "pending" } }).catch(() => 0),
      prisma.user.count({ where: { isActive: false, role: { not: "admin" }, admin_viewed_at: null } }),
    ]);
    res.json({ counts: { verifications: pendingVerifications, complaints: openComplaints, reports: openReports, affiliates: pendingAffiliates, payments: pendingPayments, users: suspendedUsers } });
  } catch (error) {
    console.error("Badge counts error:", error);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
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
      { key: "min_compatibility_score", value: 20, category: "matchmaking" },
    ];
    for (const s of settings) {
      await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value, category: s.category } });
    }

    // Seed membership plans
    const plans = [
      { key: "free", name: "Free Membership", description: "Basic access - browse and receive messages", price: 0, currency: "Birr", durationDays: 0, planType: "free", features: ["create_profile", "upload_photos", "browse_profiles", "receive_messages", "limited_daily_profiles"], isActive: true, sortOrder: 0 },
      { key: "gold", name: "Gold Membership", description: "Unlimited messaging and advanced features (no polygamy access)", price: 2400, currency: "Birr", durationDays: 365, planType: "subscription", features: ["unlimited_messaging", "unlimited_browsing", "advanced_search", "view_visitors", "view_likes", "priority_visibility", "no_credit_charges"], isActive: true, sortOrder: 1 },
      { key: "platinum", name: "Platinum Membership", description: "All Gold benefits plus polygamy chat, last seen visibility, and VIP features", price: 4800, currency: "Birr", durationDays: 365, planType: "subscription", features: ["unlimited_messaging", "unlimited_browsing", "advanced_search", "view_visitors", "view_likes", "priority_visibility", "no_credit_charges", "polygamy_chat", "last_seen_visibility", "featured_placement", "highest_search_ranking", "vip_badge", "personalized_matches", "vip_support", "early_access"], isActive: true, sortOrder: 2 },
      { key: "verification", name: "Identity Verification", description: "One-time verification fee for verified badge", price: 300, currency: "Birr", durationDays: 0, planType: "verification", features: ["verified_badge", "increased_trust", "higher_visibility"], isActive: true, sortOrder: 3 },
      { key: "boost", name: "Profile Boost", description: "7-day profile boost for maximum exposure", price: 100, currency: "Birr", durationDays: 7, planType: "boost", features: ["featured_placement", "top_search_ranking", "increased_exposure"], isActive: true, sortOrder: 4 },
    ];
    for (const p of plans) {
      await prisma.membershipPlan.upsert({ where: { key: p.key }, update: { price: p.price, durationDays: p.durationDays, features: p.features }, create: p });
    }

    // Seed contact credit packages
    const creditPackages = [
      { key: "credit_1", name: "1 Contact Credit", credits: 1, price: 100, currency: "Birr", isActive: true, sortOrder: 0 },
      { key: "credit_5", name: "5 Contact Credits", credits: 5, price: 400, currency: "Birr", isActive: true, sortOrder: 1 },
      { key: "credit_10", name: "10 Contact Credits", credits: 10, price: 700, currency: "Birr", isActive: true, sortOrder: 2 },
    ];
    for (const c of creditPackages) {
      await prisma.contactCreditPackage.upsert({ where: { key: c.key }, update: { credits: c.credits, price: c.price }, create: c });
    }

    // Seed payment methods
    const paymentMethods = [
      { key: "telebirr", name: "Telebirr", instructions: "Send payment to the Telebirr number below. Include your reference number in the receipt.", accountInfo: "Phone: 0912345678", isActive: true, sortOrder: 0 },
      { key: "cbe_birr", name: "CBE Birr", instructions: "Send payment via CBE Birr to the account below.", accountInfo: "Account: 1000123456789", isActive: true, sortOrder: 1 },
      { key: "bank_transfer", name: "Bank Transfer", instructions: "Transfer to the bank account below and upload the receipt.", accountInfo: "Bank: CBE, Account: 1000123456789, Name: Ethio Nikah", isActive: true, sortOrder: 2 },
    ];
    for (const m of paymentMethods) {
      await prisma.paymentMethod.upsert({ where: { key: m.key }, update: { instructions: m.instructions, accountInfo: m.accountInfo }, create: m });
    }

    res.json({ success: true, message: "Default data seeded" });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Failed to seed defaults" });
  }
};

exports.markUsersViewed = async (req, res) => {
  try {
    await prisma.user.updateMany({
      where: { isActive: false, role: { not: "admin" }, admin_viewed_at: null },
      data: { admin_viewed_at: new Date() },
    });
    res.json({ message: "Users marked as viewed" });
  } catch (error) {
    console.error("Mark users viewed error:", error);
    res.status(500).json({ error: "Failed to mark users as viewed" });
  }
};

// === MARK AS VIEWED (generic — clears badge counts) ===
exports.markAsViewed = async (req, res) => {
  try {
    const { type } = req.params;
    const now = new Date();
    switch (type) {
      case "verifications":
        await prisma.verification.updateMany({ where: { status: "pending", viewed_at: null }, data: { viewed_at: now } });
        break;
      case "complaints":
        await prisma.complaint.updateMany({ where: { status: "open", viewed_at: null }, data: { viewed_at: now } });
        break;
      case "reports":
        await prisma.report.updateMany({ where: { status: { in: ["open", "investigating"] }, viewed_at: null }, data: { viewed_at: now } });
        break;
      case "users":
        await prisma.user.updateMany({ where: { isActive: false, role: { not: "admin" }, admin_viewed_at: null }, data: { admin_viewed_at: now } });
        break;
      default:
        return res.status(400).json({ error: "Invalid type" });
    }
    res.json({ message: `${type} marked as viewed` });
  } catch (error) {
    console.error("Mark as viewed error:", error);
    res.status(500).json({ error: "Failed to mark as viewed" });
  }
};

// === ACCOUNT DELETION RECYCLE BIN ===
const DELETION_GRACE_DAYS = 30;

exports.getDeletedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { search } = req.query;
    const where = { deletedAt: { not: null } };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { deletedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          gender: true,
          deletedAt: true,
          dataDeletionRequestedAt: true,
          createdAt: true,
          profile: { select: { country: true, city: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const now = new Date();
    const data = users.map((u) => {
      const daysLeft = Math.max(0, DELETION_GRACE_DAYS - Math.floor((now - new Date(u.deletedAt)) / (1000 * 60 * 60 * 24)));
      return { ...u, daysLeft, canRestore: daysLeft > 0 };
    });
    res.json({ users: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Get deleted users error:", error);
    res.status(500).json({ error: "Failed to fetch deleted users" });
  }
};

exports.restoreDeletedUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.deletedAt) return res.status(400).json({ error: "Account is not deleted" });

    const daysSinceDeletion = Math.floor((new Date() - new Date(user.deletedAt)) / (1000 * 60 * 60 * 24));
    if (daysSinceDeletion >= DELETION_GRACE_DAYS) {
      return res.status(400).json({ error: "Restore window has expired. The account must be permanently purged." });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        dataDeletionRequestedAt: null,
        isActive: true,
        tokenVersion: { increment: 1 },
      },
    });

    try { require("../middleware/auth").invalidateAuthCache(id); } catch {}

    await logAudit({ actorId: adminId, actorType: "ADMIN", action: "USER_RESTORED", resource: "user", resourceId: id, details: { method: "restore" } });
    res.json({ message: "Account restored successfully" });
  } catch (error) {
    console.error("Restore user error:", error);
    res.status(500).json({ error: "Failed to restore account" });
  }
};

exports.purgeDeletedUsers = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const cutoff = new Date(Date.now() - DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);

    const eligible = await prisma.user.findMany({
      where: { deletedAt: { lte: cutoff } },
      select: { id: true, email: true, deletedAt: true },
    });

    const ids = eligible.map((u) => u.id);
    if (ids.length === 0) return res.json({ message: "No accounts are eligible for purge", purged: 0 });

    await prisma.$transaction([
      prisma.profile.deleteMany({ where: { userId: { in: ids } } }),
      prisma.verification.deleteMany({ where: { userId: { in: ids } } }),
      prisma.spousePreference.deleteMany({ where: { userId: { in: ids } } }),
      prisma.complaint.deleteMany({ where: { userId: { in: ids } } }),
      prisma.report.deleteMany({ where: { reporterId: { in: ids } } }),
      prisma.report.deleteMany({ where: { reportedId: { in: ids } } }),
      prisma.message.deleteMany({ where: { senderId: { in: ids } } }),
      prisma.match.deleteMany({ where: { userId: { in: ids } } }),
      prisma.match.deleteMany({ where: { matchedUserId: { in: ids } } }),
      prisma.subscription.deleteMany({ where: { userId: { in: ids } } }),
      prisma.payment.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);

    await logAudit({ actorId: adminId, actorType: "ADMIN", action: "PURGE_DELETED_USERS", resource: "user", details: { count: ids.length } });
    res.json({ message: `Permanently purged ${ids.length} accounts`, purged: ids.length });
  } catch (error) {
    console.error("Purge deleted users error:", error);
    res.status(500).json({ error: "Failed to purge deleted users" });
  }
};

// === LOCKOUT MANAGEMENT ===

exports.pinUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { adminPinned: true },
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "USER_PINNED", resource: "user", resourceId: id, details: {} });
    res.json({ message: "User pinned for review" });
  } catch (error) {
    console.error("Pin user error:", error);
    res.status(500).json({ error: "Failed to pin user" });
  }
};

exports.unpinUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { adminPinned: false },
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "USER_UNPINNED", resource: "user", resourceId: id, details: {} });
    res.json({ message: "User unpinned" });
  } catch (error) {
    console.error("Unpin user error:", error);
    res.status(500).json({ error: "Failed to unpin user" });
  }
};

exports.unlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: {
        loginLockoutCount: 0,
        loginLockedUntil: null,
        loginPermanentlyLocked: false,
        isFlaggedForReview: false,
        failedAttemptsInRound: 0,
        lockoutLevel: 0,
      },
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "USER_UNLOCKED", resource: "user", resourceId: id, details: {} });
    res.json({ message: "User account unlocked successfully" });
  } catch (error) {
    console.error("Unlock user error:", error);
    res.status(500).json({ error: "Failed to unlock user" });
  }
};

exports.clearFlag = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { isFlaggedForReview: false },
    });
    await logAudit({ actorId: req.user.userId, actorType: "ADMIN", action: "USER_FLAG_CLEARED", resource: "user", resourceId: id, details: {} });
    res.json({ message: "Flag cleared" });
  } catch (error) {
    console.error("Clear flag error:", error);
    res.status(500).json({ error: "Failed to clear flag" });
  }
};
