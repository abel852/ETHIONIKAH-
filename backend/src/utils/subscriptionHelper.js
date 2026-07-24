const prisma = require("../config/database");

// Cache plan features to avoid repeated DB lookups
let _planCache = null;
let _planCacheTime = 0;
const PLAN_CACHE_TTL = 60000; // 1 minute

async function loadPlanFeatures() {
  const now = Date.now();
  if (_planCache && now - _planCacheTime < PLAN_CACHE_TTL) {
    return _planCache;
  }
  const plans = await prisma.membershipPlan.findMany({ where: { isActive: true } });
  const map = {};
  for (const p of plans) {
    map[p.key] = p.features || [];
  }
  _planCache = map;
  _planCacheTime = now;
  return map;
}

function invalidatePlanCache() {
  _planCache = null;
  _planCacheTime = 0;
}

// Get user's active subscription plan key (e.g., "gold", "platinum", or null for free)
async function getUserPlanKey(userId) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "active", endDate: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { planType: true },
  });
  return sub?.planType || null;
}

// Get the list of features for the user's current plan
async function getUserFeatures(userId) {
  const planKey = await getUserPlanKey(userId);
  if (!planKey) {
    // Free user — return free plan features
    const planMap = await loadPlanFeatures();
    return planMap["free"] || ["create_profile", "upload_photos", "browse_profiles", "receive_messages", "limited_daily_profiles"];
  }
  const planMap = await loadPlanFeatures();
  return planMap[planKey] || [];
}

// Check if user has a specific feature
async function hasFeature(userId, feature) {
  const features = await getUserFeatures(userId);
  return features.includes(feature);
}

// Get full membership info for a user
async function getUserMembership(userId) {
  const planKey = await getUserPlanKey(userId);
  if (!planKey) {
    return { plan: "free", isPremium: false, features: await getUserFeatures(userId) };
  }
  const features = await getUserFeatures(userId);
  return { plan: planKey, isPremium: true, features };
}

// Daily browse limit for free users
const FREE_DAILY_BROWSE_LIMIT = 50;

// Check how many profiles the user has browsed today
async function getDailyBrowseCount(userId) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await prisma.profileView.count({
      where: { viewerId: userId, viewedAt: { gte: todayStart } },
    });
    return count;
  } catch {
    return 0;
  }
}

// Check if user can browse more profiles
async function canBrowseMore(userId) {
  const features = await getUserFeatures(userId);
  if (features.includes("unlimited_browsing")) {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }
  // Free user — limited daily profiles
  const browsed = await getDailyBrowseCount(userId);
  const remaining = Math.max(0, FREE_DAILY_BROWSE_LIMIT - browsed);
  return { allowed: remaining > 0, remaining, limit: FREE_DAILY_BROWSE_LIMIT };
}

// Record a profile view (for visitor tracking + daily browse limit)
async function recordProfileView(viewerId, viewedId) {
  if (viewerId === viewedId) return;
  try {
    // Upsert: update viewedAt if already exists, otherwise create
    await prisma.profileView.upsert({
      where: { viewerId_viewedId: { viewerId, viewedId } },
      update: { viewedAt: new Date() },
      create: { viewerId, viewedId },
    });
  } catch (err) {
    // Table might not exist yet — silently ignore
  }
}

// Get list of users who viewed this user's profile (requires view_visitors feature)
async function getProfileVisitors(userId, limit = 20) {
  try {
    const views = await prisma.profileView.findMany({
      where: { viewedId: userId },
      orderBy: { viewedAt: "desc" },
      take: limit,
      include: {
        viewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isVerified: true,
            profile: { select: { photos: true, city: true, country: true, occupation: true } },
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
          },
        },
      },
    });
    return views.map((v) => ({
      viewedAt: v.viewedAt,
      user: {
        ...v.viewer,
        membershipPlan: v.viewer.subscriptions?.length > 0 ? v.viewer.subscriptions[0].planType : null,
        isPremium: v.viewer.subscriptions?.length > 0,
      },
    }));
  } catch {
    return [];
  }
}

// Get visitor count (for all users, even free — just show the number not the list)
async function getVisitorCount(userId) {
  try {
    return await prisma.profileView.count({ where: { viewedId: userId } });
  } catch {
    return 0;
  }
}

module.exports = {
  loadPlanFeatures,
  invalidatePlanCache,
  getUserPlanKey,
  getUserFeatures,
  hasFeature,
  getUserMembership,
  canBrowseMore,
  getDailyBrowseCount,
  recordProfileView,
  getProfileVisitors,
  getVisitorCount,
  FREE_DAILY_BROWSE_LIMIT,
};
