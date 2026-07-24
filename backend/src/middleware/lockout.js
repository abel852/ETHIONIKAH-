const prisma = require("../config/database");
const { notifyAllAdmins } = require("../utils/notification");
const { logAudit } = require("../utils/auditLogger");

// ============================================================
// PROGRESSIVE LOCKOUT SYSTEM — 3 tries per round
// ============================================================
// The user gets 3 attempts per "round". After 3 failed
// attempts in a round, a lockout is applied with an
// escalating timeout. When the lockout expires, the user
// gets another 3 tries, and the next lockout is longer.
//
//   Round 1: 3 tries → 5 minute lockout
//   Round 2: 3 tries → 30 minute lockout
//   Round 3: 3 tries → 12 hour lockout
//   Round 4: 3 tries → 3 day lockout
//   Round 5: 3 tries → PERMANENT lock (contact admin)
//
// Additionally: 15 total failed attempts in any 10-day
// window → automatic permanent lock + flag + pin for admin.
// ============================================================

const MAX_ATTEMPTS_PER_ROUND = 3;

const LOCKOUT_DURATIONS = [
  5 * 60 * 1000,            // Round 1: 5 minutes
  30 * 60 * 1000,           // Round 2: 30 minutes
  12 * 60 * 60 * 1000,      // Round 3: 12 hours
  3 * 24 * 60 * 60 * 1000,  // Round 4: 3 days
];

const LOCKOUT_LABELS = [
  "5 minutes",
  "30 minutes",
  "12 hours",
  "3 days",
];

/**
 * Check if a user/email is currently locked out.
 * Returns lockout info or null if not locked.
 */
async function checkLockout(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      loginLockoutCount: true,
      loginLockedUntil: true,
      loginPermanentlyLocked: true,
      isFlaggedForReview: true,
      lockoutLevel: true,
      failedAttemptsInRound: true,
    },
  });

  if (!user) return null;

  // Permanent lock — must contact admin
  if (user.loginPermanentlyLocked) {
    return {
      locked: true,
      permanent: true,
      message: "Your account has been permanently locked due to repeated failed login attempts. Please contact admin support to restore access.",
      showContactAdmin: true,
      showForgotPassword: false,
      lockoutCount: user.loginLockoutCount,
      lockoutLevel: user.lockoutLevel,
      userId: user.id,
    };
  }

  // Temporary lock — countdown timer
  if (user.loginLockedUntil && new Date(user.loginLockedUntil) > new Date()) {
    const lockoutIndex = Math.min(user.lockoutLevel - 1, LOCKOUT_DURATIONS.length - 1);
    const lockedUntil = new Date(user.loginLockedUntil);
    const remainingMs = lockedUntil.getTime() - Date.now();

    return {
      locked: true,
      permanent: false,
      lockedUntil: lockedUntil.toISOString(),
      remainingMs,
      lockoutCount: user.loginLockoutCount,
      lockoutLevel: user.lockoutLevel,
      lockoutLabel: LOCKOUT_LABELS[lockoutIndex],
      message: `Too many failed login attempts. Please wait ${LOCKOUT_LABELS[lockoutIndex]} before trying again.`,
      showContactAdmin: user.lockoutLevel >= 3,
      showForgotPassword: false,
      userId: user.id,
    };
  }

  // Lockout expired — clear the lock timer, reset round attempts
  if (user.loginLockedUntil && new Date(user.loginLockedUntil) <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginLockedUntil: null,
        failedAttemptsInRound: 0,
      },
    });
  }

  return null;
}

/**
 * Record a failed login attempt.
 * 3 attempts per round → then escalating lockout.
 * Returns info about remaining attempts or lockout status.
 */
async function recordFailedLogin(email, ip) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      loginLockoutCount: true, loginLockedUntil: true,
      loginPermanentlyLocked: true, isFlaggedForReview: true,
      failedAttemptsInRound: true, lockoutLevel: true,
      totalFailedAttempts10Days: true, lastFailedAttemptAt: true,
    },
  });

  if (!user) return null;

  // Already permanently locked
  if (user.loginPermanentlyLocked) {
    return {
      locked: true,
      permanent: true,
      message: "Your account is permanently locked. Contact admin support.",
      showContactAdmin: true,
      attemptsRemaining: 0,
    };
  }

  // Track total failed attempts in rolling 10-day window
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  let total10Days = (user.totalFailedAttempts10Days || 0) + 1;
  if (user.lastFailedAttemptAt) {
    const sinceLast = Date.now() - new Date(user.lastFailedAttemptAt).getTime();
    if (sinceLast > TEN_DAYS_MS) {
      total10Days = 1;
    }
  }

  // Increment attempts in current round
  const attemptsInRound = (user.failedAttemptsInRound || 0) + 1;
  const attemptsRemaining = MAX_ATTEMPTS_PER_ROUND - attemptsInRound;

  // Not yet 3 attempts — just record and show remaining
  if (attemptsInRound < MAX_ATTEMPTS_PER_ROUND) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttemptsInRound: attemptsInRound,
        loginLockoutCount: (user.loginLockoutCount || 0) + 1,
        totalFailedAttempts10Days: total10Days,
        lastFailedAttemptAt: new Date(),
      },
    });

    console.warn(`[LOCKOUT] ${user.email} failed attempt ${attemptsInRound}/${MAX_ATTEMPTS_PER_ROUND} in round ${user.lockoutLevel + 1} from IP ${ip}`);

    return {
      locked: false,
      attemptsRemaining,
      totalAttempts: user.loginLockoutCount + 1,
      lockoutLevel: user.lockoutLevel,
      message: `Invalid credentials. You have ${attemptsRemaining} attempt${attemptsRemaining > 1 ? "s" : ""} remaining before your account is temporarily locked.`,
    };
  }

  // 3rd attempt in round → apply lockout
  const newLockoutLevel = (user.lockoutLevel || 0) + 1;
  const newTotalCount = (user.loginLockoutCount || 0) + 1;

  // Check 15-in-10-days rule first
  if (total10Days >= 15) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginLockoutCount: newTotalCount,
        loginLockedUntil: null,
        loginPermanentlyLocked: true,
        isFlaggedForReview: true,
        adminPinned: true,
        failedAttemptsInRound: 0,
        lockoutLevel: newLockoutLevel,
        totalFailedAttempts10Days: total10Days,
        lastFailedAttemptAt: new Date(),
      },
    });

    await notifyAllAdmins({
      type: "SECURITY_CRITICAL",
      title: "User Auto-Flagged — 15 Failed Attempts in 10 Days",
      body: `User ${user.email} (${user.firstName} ${user.lastName}) has accumulated ${total10Days} failed login attempts within 10 days from IP ${ip}. Account PERMANENTLY LOCKED and PINNED for admin review. Immediate action required.`,
    });

    try {
      await logAudit({
        adminId: null,
        action: "user_auto_flagged_15_attempts",
        resource: "auth",
        details: { email: user.email, userId: user.id, ip, totalAttempts: total10Days },
      });
    } catch {}

    console.error(`[LOCKOUT] AUTO-FLAG: ${user.email} flagged after ${total10Days} attempts in 10 days from IP ${ip}`);

    return {
      locked: true,
      permanent: true,
      message: "Your account has been permanently locked due to 15 failed login attempts within 10 days. Please contact admin support to restore access.",
      showContactAdmin: true,
      showForgotPassword: false,
      attemptsRemaining: 0,
      lockoutLevel: newLockoutLevel,
      totalFailedAttempts: total10Days,
    };
  }

  // After 5th round (level 5) → permanent lock
  if (newLockoutLevel > LOCKOUT_DURATIONS.length) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginLockoutCount: newTotalCount,
        loginLockedUntil: null,
        loginPermanentlyLocked: true,
        isFlaggedForReview: true,
        adminPinned: true,
        failedAttemptsInRound: 0,
        lockoutLevel: newLockoutLevel,
        totalFailedAttempts10Days: total10Days,
        lastFailedAttemptAt: new Date(),
      },
    });

    await notifyAllAdmins({
      type: "SECURITY_ALERT",
      title: "User Permanently Locked — Review Required",
      body: `User ${user.email} (${user.firstName} ${user.lastName}) has been permanently locked after exhausting all ${LOCKOUT_DURATIONS.length} lockout rounds from IP ${ip}. The user has been flagged and pinned for admin review.`,
    });

    try {
      await logAudit({
        adminId: null,
        action: "user_perm_locked",
        resource: "auth",
        details: { email: user.email, userId: user.id, ip, lockoutLevel: newLockoutLevel },
      });
    } catch {}

    console.error(`[LOCKOUT] PERMANENT LOCK: ${user.email} after round ${newLockoutLevel} from IP ${ip}`);

    return {
      locked: true,
      permanent: true,
      message: "Your account has been permanently locked. You have exhausted all allowed login attempts. Please contact admin support to restore access.",
      showContactAdmin: true,
      showForgotPassword: false,
      attemptsRemaining: 0,
      lockoutLevel: newLockoutLevel,
    };
  }

  // Apply progressive lockout for this round
  const lockoutIndex = newLockoutLevel - 1;
  const lockDuration = LOCKOUT_DURATIONS[lockoutIndex];
  const lockedUntil = new Date(Date.now() + lockDuration);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginLockoutCount: newTotalCount,
      loginLockedUntil: lockedUntil,
      failedAttemptsInRound: 0,
      lockoutLevel: newLockoutLevel,
      totalFailedAttempts10Days: total10Days,
      lastFailedAttemptAt: new Date(),
    },
  });

  // Notify admins at lockout level 3+
  if (newLockoutLevel >= 3) {
    await notifyAllAdmins({
      type: "SECURITY_ALERT",
      title: `Repeated Failed Logins — Lockout Level ${newLockoutLevel}`,
      body: `User ${user.email} has exhausted 3 attempts in round ${newLockoutLevel}. Account locked for ${LOCKOUT_LABELS[lockoutIndex]} from IP ${ip}. User has been flagged for review.`,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { isFlaggedForReview: true },
    });
  }

  console.warn(`[LOCKOUT] ${user.email} locked for ${LOCKOUT_LABELS[lockoutIndex]} (round ${newLockoutLevel}) from IP ${ip}`);

  return {
    locked: true,
    permanent: false,
    lockedUntil: lockedUntil.toISOString(),
    remainingMs: lockDuration,
    lockoutCount: newTotalCount,
    lockoutLevel: newLockoutLevel,
    lockoutLabel: LOCKOUT_LABELS[lockoutIndex],
    message: `Too many failed login attempts. Your account has been locked for ${LOCKOUT_LABELS[lockoutIndex]}.`,
    showContactAdmin: newLockoutLevel >= 3,
    showForgotPassword: false,
    attemptsRemaining: 0,
  };
}

/**
 * Reset lockout on successful login.
 */
async function resetLockout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginLockoutCount: 0,
      loginLockedUntil: null,
      failedAttemptsInRound: 0,
      lockoutLevel: 0,
    },
  });
}

/**
 * Check forgot password eligibility — 4 attempts per 5 days.
 * Also checks if user is flagged or locked.
 */
const FORGOT_PASSWORD_MAX = 4;
const FORGOT_PASSWORD_WINDOW_MS = 5 * 24 * 60 * 60 * 1000;

async function checkForgotPasswordEligibility(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, lastForgotPasswordAt: true, forgotPasswordCount: true,
      isFlaggedForReview: true, loginPermanentlyLocked: true,
      loginLockedUntil: true, lockoutLevel: true,
    },
  });

  if (!user) return { allowed: true };

  if (user.loginPermanentlyLocked) {
    return {
      allowed: false,
      message: "Your account is permanently locked. Please contact admin support to reset your password.",
      showContactAdmin: true,
    };
  }

  // Block if currently in active countdown lockout
  if (user.loginLockedUntil && new Date(user.loginLockedUntil) > new Date()) {
    const remainingMs = new Date(user.loginLockedUntil).getTime() - Date.now();
    const remainingMins = Math.ceil(remainingMs / (60 * 1000));
    const remainingHours = Math.floor(remainingMins / 60);
    const remainingDays = Math.floor(remainingHours / 24);
    let timeStr;
    if (remainingDays > 0) timeStr = `${remainingDays} day(s)`;
    else if (remainingHours > 0) timeStr = `${remainingHours} hour(s)`;
    else timeStr = `${remainingMins} minute(s)`;
    return {
      allowed: false,
      message: `Your account is temporarily locked due to failed login attempts. You cannot reset your password until the lockout expires in ${timeStr}. Please wait for the countdown to finish.`,
      showContactAdmin: user.lockoutLevel >= 3,
      remainingMs,
    };
  }

  // Check 4-attempt-per-5-days limit
  if (user.lastForgotPasswordAt) {
    const elapsed = Date.now() - new Date(user.lastForgotPasswordAt).getTime();
    if (elapsed < FORGOT_PASSWORD_WINDOW_MS && user.forgotPasswordCount >= FORGOT_PASSWORD_MAX) {
      const remainingMs = FORGOT_PASSWORD_WINDOW_MS - elapsed;
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      return {
        allowed: false,
        message: `You have used all ${FORGOT_PASSWORD_MAX} password reset attempts for this 5-day period. Please try again in ${remainingDays} day(s).`,
        remainingMs,
        attemptsUsed: user.forgotPasswordCount,
        maxAttempts: FORGOT_PASSWORD_MAX,
      };
    }
  }

  const attemptsUsed = (user.lastForgotPasswordAt && (Date.now() - new Date(user.lastForgotPasswordAt).getTime() < FORGOT_PASSWORD_WINDOW_MS)) ? user.forgotPasswordCount : 0;
  return { allowed: true, attemptsUsed, maxAttempts: FORGOT_PASSWORD_MAX, attemptsRemaining: FORGOT_PASSWORD_MAX - attemptsUsed };
}

/**
 * Record forgot password usage — increment count within 5-day window, reset if window expired.
 */
async function recordForgotPasswordUsage(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastForgotPasswordAt: true, forgotPasswordCount: true },
  });

  const now = new Date();
  let newCount = 1;

  if (user?.lastForgotPasswordAt) {
    const elapsed = Date.now() - new Date(user.lastForgotPasswordAt).getTime();
    if (elapsed < FORGOT_PASSWORD_WINDOW_MS) {
      newCount = (user.forgotPasswordCount || 0) + 1;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastForgotPasswordAt: now, forgotPasswordCount: newCount },
  });

  return { count: newCount, max: FORGOT_PASSWORD_MAX, remaining: FORGOT_PASSWORD_MAX - newCount };
}

module.exports = {
  checkLockout,
  recordFailedLogin,
  resetLockout,
  checkForgotPasswordEligibility,
  recordForgotPasswordUsage,
  LOCKOUT_DURATIONS,
  LOCKOUT_LABELS,
  MAX_ATTEMPTS_PER_ROUND,
};
