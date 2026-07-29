const prisma = require("../config/database");
const { decrypt } = require("../utils/encryption");
const { createNotification } = require("../utils/notification");
const { getUserFeatures, canBrowseMore, recordProfileView, getUserMembership } = require("../utils/subscriptionHelper");

// ===================== AI MATCHMAKING ALGORITHM =====================
// 13-category weighted scoring system producing a score out of 100
// Categories (admin-configurable weights):
//   1. Religious Compatibility     - 15%
//   2. Age Compatibility           - 12%
//   3. Marital Status              - 10%
//   4. Wali & Family Involvement   - 10%
//   5. Children Preference         - 10%
//   6. Health & Diseases           - 10%
//   7. Marriage Goals              - 8%
//   8. Personal Compatibility      - 7%
//   9. Location Compatibility      - 5%
//  10. Lifestyle Compatibility     - 5%
//  11. Education & Career          - 5%
//  12. Family & Cultural           - 2%
//  13. Interests & Hobbies         - 1%
// Admin can adjust these weights via System Settings (key prefix: matchmaking_weight_)
// ============================================================

const DEFAULT_CATEGORY_WEIGHTS = {
  religious: 15,
  age: 12,
  maritalStatus: 10,
  wali: 10,
  children: 10,
  health: 10,
  marriageGoals: 8,
  personal: 7,
  location: 5,
  lifestyle: 5,
  education: 5,
  family: 2,
  hobbies: 1,
};

// Cache for dynamic weights — reloaded when admin updates settings
let _cachedWeights = null;
let _weightsCacheTime = 0;
const WEIGHTS_CACHE_TTL = 60000; // 1 minute cache

async function getCategoryWeights() {
  const now = Date.now();
  if (_cachedWeights && now - _weightsCacheTime < WEIGHTS_CACHE_TTL) {
    return _cachedWeights;
  }
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "matchmaking_weight_" } },
    });
    const weights = { ...DEFAULT_CATEGORY_WEIGHTS };
    for (const s of settings) {
      const catKey = s.key.replace("matchmaking_weight_", "");
      if (weights.hasOwnProperty(catKey)) {
        const val = Number(s.value);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          weights[catKey] = val;
        }
      }
    }
    _cachedWeights = weights;
    _weightsCacheTime = now;
    return weights;
  } catch {
    return DEFAULT_CATEGORY_WEIGHTS;
  }
}

// Invalidate cache when admin updates weights (called from adminController)
function invalidateWeightsCache() {
  _cachedWeights = null;
  _weightsCacheTime = 0;
}

// Synchronous accessor for use in scoring functions (after getCategoryWeights has been called)
let _activeWeights = { ...DEFAULT_CATEGORY_WEIGHTS };
function getWeights() {
  return _activeWeights;
}

const RELIGIOUS_LEVELS = ["liberal", "moderate", "practicing", "very_committed"];
const PRAYER_LEVELS = ["never", "sometimes", "most_prayers", "all_prayers"];
const QURAN_LEVELS = ["never", "sometimes", "often", "daily"];
const EDUCATION_LEVELS = ["high_school", "diploma", "bachelors", "masters", "phd"];

// --- Helpers ---

const decryptHealthInfo = (healthInfo) => {
  if (!healthInfo) return null;
  const decrypted = {};
  for (const [key, value] of Object.entries(healthInfo)) {
    if (["hivStatus","stdStatus","stdDetails","hereditaryDiseases","hereditaryDetails","chronicConditions","chronicDetails","disabilities","disabilityDetails","otherConditions"].includes(key)) {
      try { decrypted[key] = value ? decrypt(value) : null; } catch { decrypted[key] = null; }
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
};

const computeAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const levelScore = (a, b, levels) => {
  if (!a || !b) return 0;
  const ia = levels.indexOf(a);
  const ib = levels.indexOf(b);
  if (ia < 0 || ib < 0) return a === b ? 1 : 0;
  const diff = Math.abs(ia - ib);
  if (diff === 0) return 1;
  if (diff === 1) return 0.7;
  if (diff === 2) return 0.3;
  return 0;
};

const exactScore = (a, b) => (a && b && a === b) ? 1 : 0;

const anyMatchScore = (a, b) => {
  if (!a || !b) return 0;
  if (a === "any" || b === "any") return 0.8;
  return a === b ? 1 : 0;
};

const arrayOverlapScore = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
  const set2 = new Set(arr2);
  const overlap = arr1.filter((x) => set2.has(x)).length;
  return Math.min(overlap / Math.min(arr1.length, arr2.length), 1);
};

// --- Health penalty (applied after total score) ---

const computeHealthPenalty = (userHealthInfo, matchHealthInfo) => {
  if (!userHealthInfo || !matchHealthInfo) return 0;
  let penalty = 0;
  if (userHealthInfo.hivMatchPreference === "no" && matchHealthInfo.hivStatus === "positive") penalty += 25;
  if (userHealthInfo.stdMatchPreference === "no" && matchHealthInfo.stdStatus === "yes") penalty += 20;
  if (userHealthInfo.hereditaryMatchPreference === "no" && matchHealthInfo.hereditaryDiseases === "yes") penalty += 15;
  if (userHealthInfo.healthMatchPreference === "no") {
    if (matchHealthInfo.chronicConditions === "yes" || matchHealthInfo.disabilities === "yes" || matchHealthInfo.otherConditions) penalty += 15;
  }
  // If user prefers "same" for HIV, give bonus for matching status
  return penalty;
};

const computeHealthBonus = (userHealthInfo, matchHealthInfo) => {
  if (!userHealthInfo || !matchHealthInfo) return 0;
  let bonus = 0;
  if (userHealthInfo.hivMatchPreference === "same" && matchHealthInfo.hivStatus === userHealthInfo.hivStatus) bonus += 5;
  if (userHealthInfo.stdMatchPreference === "same" && matchHealthInfo.stdStatus === userHealthInfo.stdStatus) bonus += 3;
  return bonus;
};

// --- Category Scorers ---

function scoreReligious(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  // Religious commitment level (8 pts)
  const relScore = levelScore(userProfile.religiousCommitment, matchProfile.religiousCommitment, RELIGIOUS_LEVELS);
  points += relScore * 8;
  if (relScore >= 0.7) reasons.push("Similar religious commitment");

  // Prayer habits (6 pts)
  const prayerScore = levelScore(userProfile.prayerHabits, matchProfile.prayerHabits, PRAYER_LEVELS);
  points += prayerScore * 6;
  if (prayerScore >= 0.7) reasons.push("Compatible prayer habits");

  // Quran reading frequency (4 pts)
  const quranScore = levelScore(userProfile.quranReadingFrequency, matchProfile.quranReadingFrequency, QURAN_LEVELS);
  points += quranScore * 4;
  if (quranScore >= 0.7) reasons.push("Similar Quran reading frequency");

  // Islamic classes attendance (3 pts)
  points += exactScore(userProfile.islamicClassesAttendance, matchProfile.islamicClassesAttendance) * 3;

  // Preferred religious commitment match (4 pts)
  if (userPref) {
    const prefRelScore = anyMatchScore(matchProfile.religiousCommitment, userPref.preferredReligiousCommitment);
    points += prefRelScore * 4;
  }

  return { score: Math.min(points, getWeights().religious), reasons };
}

// --- Age Compatibility ---
function scoreAge(userProfile, matchProfile, userPref, matchPref, userAge, matchAge) {
  let points = 0;
  const reasons = [];

  // Age difference scoring (5 pts)
  const ageDiff = Math.abs(userAge - matchAge);
  let ageScoreVal = 0;
  if (ageDiff <= 3) ageScoreVal = 1;
  else if (ageDiff <= 7) ageScoreVal = 0.7;
  else if (ageDiff <= 12) ageScoreVal = 0.4;
  else ageScoreVal = 0.1;
  points += ageScoreVal * 5;
  if (ageScoreVal >= 0.7) reasons.push("Compatible age difference");

  // Check if match age is within user's preferred range (5 pts)
  if (userPref && userPref.preferredAgeMin && userPref.preferredAgeMax) {
    if (matchAge >= userPref.preferredAgeMin && matchAge <= userPref.preferredAgeMax) {
      points += 5;
      reasons.push("Within preferred age range");
    } else {
      const mid = (userPref.preferredAgeMin + userPref.preferredAgeMax) / 2;
      const dist = Math.abs(matchAge - mid);
      const range = userPref.preferredAgeMax - userPref.preferredAgeMin || 10;
      points += Math.max(0, (1 - dist / range)) * 5;
    }
  }

  return { score: Math.min(points, getWeights().age), reasons };
}

// --- Marital Status ---
function scoreMaritalStatus(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  // Exact marital status match (5 pts)
  if (exactScore(userProfile.maritalStatus, matchProfile.maritalStatus)) {
    points += 5;
    reasons.push("Same marital status");
  } else {
    points += 1;
  }

  // User's preferred marital status (5 pts)
  if (userPref) {
    const prefScore = anyMatchScore(String(matchProfile.maritalStatus), userPref.preferredMaritalStatus);
    points += prefScore * 5;
    if (prefScore >= 0.8) reasons.push("Matches your preferred marital status");
  }

  return { score: Math.min(points, getWeights().maritalStatus), reasons };
}

// --- Wali & Family Involvement ---
function scoreWali(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  // Family involvement level match (5 pts)
  const famScore = exactScore(userProfile.familyInvolvement, matchProfile.familyInvolvement);
  points += famScore * 5;
  if (famScore > 0) reasons.push("Similar family involvement expectations");

  // Gender interaction preference (3 pts) - relates to wali oversight
  if (userProfile.genderInteraction && matchProfile.genderInteraction) {
    const giScore = exactScore(userProfile.genderInteraction, matchProfile.genderInteraction);
    points += giScore * 3;
    if (giScore > 0) reasons.push("Similar gender interaction preferences");
  }

  // Preferred family involvement match (2 pts)
  if (userPref && userPref.preferredFamilyInvolvement) {
    const prefFamScore = anyMatchScore(matchProfile.familyInvolvement, userPref.preferredFamilyInvolvement);
    points += prefFamScore * 2;
  }

  return { score: Math.min(points, getWeights().wali), reasons };
}

// --- Children Preference ---
function scoreChildren(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  // Children preference match (5 pts) - whether they want children or not
  if (exactScore(userProfile.childrenPreference, matchProfile.childrenPreference)) {
    points += 5;
    reasons.push("Same children preference");
  } else {
    points += 1;
  }

  // Children status match (3 pts) - whether they already have children
  if (exactScore(userProfile.childrenStatus, matchProfile.childrenStatus)) {
    points += 3;
    if (userProfile.childrenStatus) reasons.push("Similar children status");
  }

  // Preferred children status from spouse preference (2 pts)
  if (userPref && userPref.preferredChildrenStatus) {
    const prefScore = anyMatchScore(matchProfile.childrenStatus, userPref.preferredChildrenStatus);
    points += prefScore * 2;
  }

  return { score: Math.min(points, getWeights().children), reasons };
}

// --- Health & Diseases ---
function scoreHealth(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  const userHealth = decryptHealthInfo(userProfile.health_info);
  const matchHealth = decryptHealthInfo(matchProfile.health_info);

  if (!userHealth || !matchHealth) {
    // No health info available — give neutral score
    return { score: Math.round(getWeights().health * 0.5), reasons: ["Health info not shared"] };
  }

  // HIV status compatibility (3 pts)
  if (userHealth.hivMatchPreference === "same" && matchHealth.hivStatus === userHealth.hivStatus) {
    points += 3;
    reasons.push("Compatible HIV status");
  } else if (userHealth.hivMatchPreference === "any") {
    points += 2;
  } else if (userHealth.hivMatchPreference === "no" && matchHealth.hivStatus === "negative") {
    points += 3;
    reasons.push("Negative HIV status as preferred");
  }

  // STD status compatibility (2 pts)
  if (userHealth.stdMatchPreference === "same" && matchHealth.stdStatus === userHealth.stdStatus) {
    points += 2;
  } else if (userHealth.stdMatchPreference === "any") {
    points += 1.5;
  } else if (userHealth.stdMatchPreference === "no" && matchHealth.stdStatus === "no") {
    points += 2;
    reasons.push("No STD as preferred");
  }

  // Hereditary diseases compatibility (2 pts)
  if (userHealth.hereditaryMatchPreference === "same" && matchHealth.hereditaryDiseases === userHealth.hereditaryDiseases) {
    points += 2;
  } else if (userHealth.hereditaryMatchPreference === "any") {
    points += 1.5;
  } else if (userHealth.hereditaryMatchPreference === "no" && matchHealth.hereditaryDiseases === "no") {
    points += 2;
    reasons.push("No hereditary diseases as preferred");
  }

  // General health compatibility (3 pts)
  if (userHealth.healthMatchPreference === "any") {
    points += 2;
  } else if (userHealth.healthMatchPreference === "no") {
    if (matchHealth.chronicConditions === "no" && matchHealth.disabilities === "no") {
      points += 3;
      reasons.push("Good health as preferred");
    } else {
      points += 0;
    }
  } else if (userHealth.healthMatchPreference === "same") {
    points += 1.5;
  }

  return { score: Math.min(points, getWeights().health), reasons };
}

function scoreMarriageGoals(userProfile, matchProfile, userPref, matchPref) {
  let points = 0;
  const reasons = [];

  // Desired marriage timeline (5 pts)
  const timelineScore = exactScore(userProfile.desiredMarriageTimeline, matchProfile.desiredMarriageTimeline);
  points += timelineScore * 5;
  if (timelineScore > 0) reasons.push("Similar marriage timeline");

  // Polygamy preference (3 pts)
  if (userPref) {
    points += anyMatchScore(matchProfile.polygamyPreference, userPref.polygamyPreference) * 3;
  }

  return { score: Math.min(points, getWeights().marriageGoals), reasons };
}

function scorePersonal(userProfile, matchProfile, userPref, matchPref, userAge, matchAge) {
  let points = 0;
  const reasons = [];

  // Height compatibility (3 pts) - prefer similar or user preference
  if (userProfile.height && matchProfile.height) {
    const hDiff = Math.abs(userProfile.height - matchProfile.height);
    const hScore = hDiff <= 15 ? 3 : hDiff <= 25 ? 1.5 : 0;
    points += hScore;
    if (hScore >= 3) reasons.push("Compatible height");
  }

  // Education level (2 pts)
  const eduScore = levelScore(userProfile.educationLevel, matchProfile.educationLevel, EDUCATION_LEVELS);
  points += eduScore * 2;
  if (eduScore >= 0.7) reasons.push("Compatible education levels");

  // Languages spoken (2 pts)
  const langScore = arrayOverlapScore(userProfile.languages, matchProfile.languages);
  points += langScore * 2;
  if (langScore > 0) reasons.push("Shared languages");

  return { score: Math.min(points, getWeights().personal), reasons };
}

function scoreLifestyle(userProfile, matchProfile) {
  let points = 0;
  const reasons = [];

  // Smoking habits (3 pts) - both non-smokers is ideal
  if (userProfile.smokingHabits === "non_smoker" && matchProfile.smokingHabits === "non_smoker") {
    points += 3;
    reasons.push("Both non-smokers");
  } else if (exactScore(userProfile.smokingHabits, matchProfile.smokingHabits)) {
    points += 2;
  } else {
    points += 0.5;
  }

  // Khat usage (2 pts)
  if (userProfile.khatUsage === "never" && matchProfile.khatUsage === "never") {
    points += 2;
    reasons.push("Both avoid khat");
  } else if (exactScore(userProfile.khatUsage, matchProfile.khatUsage)) {
    points += 1.5;
  }

  // Exercise habits (2 pts)
  points += exactScore(userProfile.exerciseHabits, matchProfile.exerciseHabits) * 2;

  // Living preference (1.5 pts)
  points += exactScore(userProfile.livingPreference, matchProfile.livingPreference) * 1.5;

  // Interests overlap (1.5 pts)
  const interestScore = arrayOverlapScore(userProfile.interests, matchProfile.interests);
  points += interestScore * 1.5;
  if (interestScore > 0.3) reasons.push("Shared hobbies");

  return { score: Math.min(points, getWeights().lifestyle), reasons };
}

function scoreLocation(userProfile, matchProfile, userPref) {
  let points = 0;
  const reasons = [];

  // Same country (4 pts)
  if (exactScore(userProfile.country, matchProfile.country)) {
    points += 4;
    reasons.push("Same country");
  }

  // Same city (3 pts)
  if (exactScore(userProfile.city, matchProfile.city)) {
    points += 3;
    reasons.push("Same city");
  }

  // Preferred location match (3 pts)
  if (userPref) {
    const prefLoc = userPref.preferredLocation;
    if (prefLoc === "any" || !prefLoc) {
      points += 3;
    } else if (exactScore(matchProfile.country, prefLoc) || exactScore(matchProfile.city, prefLoc) || exactScore(matchProfile.region, prefLoc)) {
      points += 3;
    }
  }

  return { score: Math.min(points, getWeights().location), reasons };
}

function scoreFamily(userProfile, matchProfile) {
  let points = 0;
  const reasons = [];

  // Ethnic background (3 pts)
  if (exactScore(userProfile.ethnicBackground, matchProfile.ethnicBackground)) {
    points += 3;
    reasons.push("Same ethnic background");
  }

  // Mother tongue (2 pts)
  if (exactScore(userProfile.motherTongue, matchProfile.motherTongue)) {
    points += 2;
    reasons.push("Same mother tongue");
  }

  return { score: Math.min(points, getWeights().family), reasons };
}

function scoreEducation(userProfile, matchProfile, userPref) {
  let points = 0;
  const reasons = [];

  // Education level match (3 pts)
  const eduScore = levelScore(userProfile.educationLevel, matchProfile.educationLevel, EDUCATION_LEVELS);
  points += eduScore * 3;
  if (eduScore >= 0.7) reasons.push("Similar education level");

  // Preferred education level (1 pt)
  if (userPref) {
    points += anyMatchScore(matchProfile.educationLevel, userPref.preferredEducationLevel) * 1;
  }

  // Employment status (1 pt)
  points += exactScore(userProfile.employmentStatus, matchProfile.employmentStatus) * 1;

  return { score: Math.min(points, getWeights().education), reasons };
}

function scoreHobbies(userProfile, matchProfile) {
  let points = 0;
  const reasons = [];

  // Interests overlap (3 pts)
  const interestScore = arrayOverlapScore(userProfile.interests, matchProfile.interests);
  points += interestScore * 3;
  if (interestScore >= 0.4) reasons.push("Shared interests and hobbies");

  // Qualities overlap (2 pts)
  const qualScore = arrayOverlapScore(userProfile.qualities, matchProfile.qualities);
  points += qualScore * 2;

  return { score: Math.min(points, getWeights().hobbies), reasons };
}

// --- Main scoring function ---

function computeCompatibilityScore(user, match) {
  const userProfile = user.profile || {};
  const matchProfile = match.profile || {};
  const userPref = userProfile.spousePreference;
  const matchPref = matchProfile.spousePreference;
  const userAge = computeAge(user.dateOfBirth);
  const matchAge = computeAge(match.dateOfBirth);

  const categories = {};
  const allReasons = [];
  const allDifferences = [];

  const W = getWeights();

  // 1. Religious Compatibility
  const rel = scoreReligious(userProfile, matchProfile, userPref, matchPref);
  categories.religious = { score: rel.score, max: W.religious, reasons: rel.reasons };
  allReasons.push(...rel.reasons);

  // 2. Age Compatibility
  const ageScore = scoreAge(userProfile, matchProfile, userPref, matchPref, userAge, matchAge);
  categories.age = { score: ageScore.score, max: W.age, reasons: ageScore.reasons };
  allReasons.push(...ageScore.reasons);

  // 3. Marital Status
  const ms = scoreMaritalStatus(userProfile, matchProfile, userPref, matchPref);
  categories.maritalStatus = { score: ms.score, max: W.maritalStatus, reasons: ms.reasons };
  allReasons.push(...ms.reasons);

  // 4. Wali & Family Involvement
  const wali = scoreWali(userProfile, matchProfile, userPref, matchPref);
  categories.wali = { score: wali.score, max: W.wali, reasons: wali.reasons };
  allReasons.push(...wali.reasons);

  // 5. Children Preference
  const chd = scoreChildren(userProfile, matchProfile, userPref, matchPref);
  categories.children = { score: chd.score, max: W.children, reasons: chd.reasons };
  allReasons.push(...chd.reasons);

  // 6. Health & Diseases
  const hlt = scoreHealth(userProfile, matchProfile, userPref, matchPref);
  categories.health = { score: hlt.score, max: W.health, reasons: hlt.reasons };
  allReasons.push(...hlt.reasons);

  // 7. Marriage Goals
  const mg = scoreMarriageGoals(userProfile, matchProfile, userPref, matchPref);
  categories.marriageGoals = { score: mg.score, max: W.marriageGoals, reasons: mg.reasons };
  allReasons.push(...mg.reasons);

  // 8. Personal Compatibility
  const pc = scorePersonal(userProfile, matchProfile, userPref, matchPref, userAge, matchAge);
  categories.personal = { score: pc.score, max: W.personal, reasons: pc.reasons };
  allReasons.push(...pc.reasons);

  // 9. Lifestyle Compatibility
  const ls = scoreLifestyle(userProfile, matchProfile);
  categories.lifestyle = { score: ls.score, max: W.lifestyle, reasons: ls.reasons };
  allReasons.push(...ls.reasons);

  // 10. Location Compatibility
  const loc = scoreLocation(userProfile, matchProfile, userPref);
  categories.location = { score: loc.score, max: W.location, reasons: loc.reasons };
  allReasons.push(...loc.reasons);

  // 11. Education & Career
  const edu = scoreEducation(userProfile, matchProfile, userPref);
  categories.education = { score: edu.score, max: W.education, reasons: edu.reasons };
  allReasons.push(...edu.reasons);

  // 12. Family & Cultural
  const fam = scoreFamily(userProfile, matchProfile);
  categories.family = { score: fam.score, max: W.family, reasons: fam.reasons };
  allReasons.push(...fam.reasons);

  // 13. Interests & Hobbies
  const hob = scoreHobbies(userProfile, matchProfile);
  categories.hobbies = { score: hob.score, max: W.hobbies, reasons: hob.reasons };
  allReasons.push(...hob.reasons);

  // Total raw score
  let totalScore = Object.values(categories).reduce((sum, c) => sum + c.score, 0);

  // Mutual preference check - does the match's preferences include the user?
  let mutualBonus = 0;
  if (matchPref) {
    const myAge = computeAge(user.dateOfBirth);
    if (matchPref.preferredAgeMin && matchPref.preferredAgeMax) {
      if (myAge >= matchPref.preferredAgeMin && myAge <= matchPref.preferredAgeMax) mutualBonus += 2;
    }
    if (anyMatchScore(String(userProfile.maritalStatus), matchPref.preferredMaritalStatus) >= 0.8) mutualBonus += 1;
    if (anyMatchScore(userProfile.religiousCommitment, matchPref.preferredReligiousCommitment) >= 0.8) mutualBonus += 2;
  }

  // Verified bonus
  const verifiedBonus = match.isVerified ? 2 : 0;

  // Final score
  let finalScore = totalScore + mutualBonus + verifiedBonus;
  finalScore = Math.min(Math.max(Math.round(finalScore), 0), 100);

  // Determine recommendation level
  let recommendationLevel;
  if (finalScore >= 95) recommendationLevel = "Exceptional Match";
  else if (finalScore >= 85) recommendationLevel = "Excellent Match";
  else if (finalScore >= 75) recommendationLevel = "Strong Match";
  else if (finalScore >= 60) recommendationLevel = "Good Match";
  else recommendationLevel = "Low Compatibility";

  // Generate potential differences
  if (userProfile.religiousCommitment !== matchProfile.religiousCommitment) {
    allDifferences.push("Different levels of religious commitment");
  }
  if (userProfile.desiredMarriageTimeline !== matchProfile.desiredMarriageTimeline) {
    allDifferences.push("Different marriage timelines");
  }
  if (userProfile.country === matchProfile.country && userProfile.city !== matchProfile.city) {
    allDifferences.push("Different cities within the same country");
  }
  if (userProfile.educationLevel !== matchProfile.educationLevel) {
    allDifferences.push("Different education levels");
  }
  if (userProfile.familyInvolvement !== matchProfile.familyInvolvement) {
    allDifferences.push("Different family involvement expectations");
  }
  if (Math.abs(userAge - matchAge) > 7) {
    allDifferences.push("Notable age difference");
  }
  if (userProfile.ethnicBackground !== matchProfile.ethnicBackground) {
    allDifferences.push("Different ethnic backgrounds");
  }

  return {
    score: finalScore,
    recommendationLevel,
    categories,
    strengths: [...new Set(allReasons)].slice(0, 8),
    potentialDifferences: [...new Set(allDifferences)].slice(0, 5),
    mutualBonus,
    verifiedBonus,
  };
}

// ===================== CONTROLLER =====================

const getRecommendedMatches = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check browsing limits for free users
    const browseStatus = await canBrowseMore(userId);
    if (!browseStatus.allowed) {
      return res.status(403).json({
        error: "You have reached your daily browsing limit. Upgrade to Gold or Platinum for unlimited browsing.",
        limit: browseStatus.limit,
        used: browseStatus.limit - browseStatus.remaining,
      });
    }

    const features = await getUserFeatures(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            spousePreference: true,
            health_info: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      return res.json({ matches: [], needsProfile: true });
    }

    const oppositeGender = user.gender === "male" ? "female" : "male";

    const potentialMatches = await prisma.user.findMany({
      where: {
        gender: oppositeGender,
        isActive: true,
        profile: { isNot: null },
        id: { not: userId },
      },
      include: {
        profile: {
          include: {
            spousePreference: true,
            health_info: true,
          },
        },
        subscriptions: {
          where: { status: "active", endDate: { gte: new Date() } },
          select: { planType: true, status: true, endDate: true },
          take: 1,
        },
      },
      take: 100,
    });

    // Load dynamic category weights from DB (admin-configurable)
    _activeWeights = await getCategoryWeights();

    const scoredMatches = potentialMatches.map((match) => {
      const compatibility = computeCompatibilityScore(user, match);
      const { passwordHash, email, phone, ...safe } = match;
      const plan = match.subscriptions?.length > 0 ? match.subscriptions[0].planType : null;
      return {
        ...safe,
        membershipPlan: plan,
        isPremium: !!plan,
        isVip: plan === "platinum",
        hasPriorityVisibility: plan === "gold" || plan === "platinum",
        compatibilityScore: compatibility.score,
        recommendationLevel: compatibility.recommendationLevel,
        compatibilityCategories: compatibility.categories,
        strengths: compatibility.strengths,
        potentialDifferences: compatibility.potentialDifferences,
      };
    });

    // Sort: priority visibility first, then by compatibility score
    scoredMatches.sort((a, b) => {
      if (a.hasPriorityVisibility && !b.hasPriorityVisibility) return -1;
      if (!a.hasPriorityVisibility && b.hasPriorityVisibility) return 1;
      return b.compatibilityScore - a.compatibilityScore;
    });

    // Free users get limited results, premium get full list
    const resultLimit = features.includes("unlimited_browsing") ? 50 : 10;
    res.json({
      matches: scoredMatches.slice(0, resultLimit),
      browseLimit: browseStatus.limit,
      browseRemaining: browseStatus.remaining,
    });
  } catch (error) {
    console.error("Get recommended matches error:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};

const searchProfiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ageMin, ageMax, maritalStatus, educationLevel, country, city, religiousCommitment, isVerified } = req.query;

    // Check browsing limits for free users
    const browseStatus = await canBrowseMore(userId);
    if (!browseStatus.allowed) {
      return res.status(403).json({
        error: "You have reached your daily browsing limit. Upgrade to Gold or Platinum for unlimited browsing.",
        limit: browseStatus.limit,
        used: browseStatus.limit - browseStatus.remaining,
      });
    }

    // Check if user has advanced_search feature
    const features = await getUserFeatures(userId);
    const hasAdvancedSearch = features.includes("advanced_search");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    const oppositeGender = user.gender === "male" ? "female" : "male";

    const where = {
      gender: oppositeGender,
      isActive: true,
      profile: { isNot: null },
      id: { not: userId },
    };

    // Basic filters available to all users
    if (ageMin || ageMax) {
      where.profile = {
        ...where.profile,
        user: {
          dateOfBirth: {},
        },
      };
    }

    // Advanced filters — only for Gold/Platinum (advanced_search feature)
    if (maritalStatus && hasAdvancedSearch) {
      where.profile.maritalStatus = maritalStatus;
    }

    if (educationLevel && hasAdvancedSearch) {
      where.profile.educationLevel = educationLevel;
    }

    if (country) {
      where.profile.country = country;
    }

    if (city && hasAdvancedSearch) {
      where.profile.city = city;
    }

    if (religiousCommitment && hasAdvancedSearch) {
      where.profile.religiousCommitment = religiousCommitment;
    }

    if (isVerified === "true") {
      where.isVerified = true;
    }

    // Free users get fewer results
    const resultLimit = features.includes("unlimited_browsing") ? 50 : 10;

    const profiles = await prisma.user.findMany({
      where,
      include: {
        profile: {
          include: {
            spousePreference: true,
          },
        },
        subscriptions: {
          where: { status: "active", endDate: { gte: new Date() } },
          select: { planType: true },
          take: 1,
        },
      },
      take: resultLimit,
      orderBy: { createdAt: "desc" },
    });

    const profilesWithoutPassword = profiles.map(({ passwordHash, email, phone, ...profile }) => {
      const plan = profile.subscriptions?.length > 0 ? profile.subscriptions[0].planType : null;
      delete profile.subscriptions;
      return {
        ...profile,
        membershipPlan: plan,
        isPremium: !!plan,
        isVip: plan === "platinum",
        hasPriorityVisibility: plan === "gold" || plan === "platinum",
      };
    });

    // Sort: premium users with priority_visibility first, then by createdAt
    profilesWithoutPassword.sort((a, b) => {
      if (a.hasPriorityVisibility && !b.hasPriorityVisibility) return -1;
      if (!a.hasPriorityVisibility && b.hasPriorityVisibility) return 1;
      return 0;
    });

    res.json({
      profiles: profilesWithoutPassword,
      browseLimit: browseStatus.limit,
      browseRemaining: browseStatus.remaining,
      advancedFilters: hasAdvancedSearch,
    });
  } catch (error) {
    console.error("Search profiles error:", error);
    res.status(500).json({ error: "Failed to search profiles" });
  }
};

const removeInterest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchedUserId } = req.body;

    const match = await prisma.match.findFirst({
      where: { userId, matchedUserId },
    });

    if (!match) {
      return res.status(404).json({ error: "Interest not found" });
    }

    await prisma.match.delete({ where: { id: match.id } });

    res.json({ message: "Interest removed" });
  } catch (error) {
    console.error("Remove interest error:", error);
    res.status(500).json({ error: "Failed to remove interest" });
  }
};

const sendInterest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchedUserId } = req.body;

    const existingMatch = await prisma.match.findFirst({
      where: {
        userId,
        matchedUserId,
      },
    });

    if (existingMatch) {
      return res.status(200).json({ message: "Interest already sent", match: existingMatch });
    }

    const match = await prisma.match.create({
      data: {
        userId,
        matchedUserId,
        status: "accepted",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        matchedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const liker = await prisma.user.findUnique({ where: { id: userId } });
    if (liker) {
      await createNotification({
        userId: matchedUserId,
        type: "like",
        title: "New Like!",
        body: `${liker.firstName} ${liker.lastName} liked your profile.`,
      });
    }

    res.status(201).json({ message: "Interest sent successfully", match });
  } catch (error) {
    console.error("Send interest error:", error);
    res.status(500).json({ error: "Failed to send interest" });
  }
};

const passProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { matchedUserId } = req.body;

    if (!matchedUserId || matchedUserId === userId) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Record a profile view so this user won't appear in suggestions again
    await prisma.profileView.upsert({
      where: { viewerId_viewedId: { viewerId: userId, viewedId: matchedUserId } },
      update: { viewedAt: new Date() },
      create: { viewerId: userId, viewedId: matchedUserId },
    });

    res.json({ message: "Profile passed" });
  } catch (error) {
    console.error("Pass profile error:", error);
    res.status(500).json({ error: "Failed to pass profile" });
  }
};

const respondToInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        matchedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ message: "Interest response recorded", match });
  } catch (error) {
    console.error("Respond to interest error:", error);
    res.status(500).json({ error: "Failed to respond to interest" });
  }
};

const getMyMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = {
      OR: [{ userId }, { matchedUserId: userId }],
    };

    if (status) {
      where.status = status;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            profile: true,
          },
        },
        matchedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ matches });
  } catch (error) {
    console.error("Get my matches error:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { favoritedUserId } = req.body;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_favoritedUserId: {
          userId,
          favoritedUserId,
        },
      },
    });

    if (existingFavorite) {
      return res.status(400).json({ error: "Already in favorites" });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        favoritedUserId,
      },
    });

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    console.error("Add to favorites error:", error);
    res.status(500).json({ error: "Failed to add to favorites" });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            isVerified: true,
            profile: true,
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = favorites.map((f) => {
      const plan = f.user.subscriptions?.length > 0 ? f.user.subscriptions[0].planType : null;
      delete f.user.subscriptions;
      return { ...f, user: { ...f.user, membershipPlan: plan, isPremium: !!plan } };
    });

    res.json({ favorites: enriched });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { favoritedUserId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        userId,
        favoritedUserId,
      },
    });

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    res.status(500).json({ error: "Failed to remove from favorites" });
  }
};

const getSuggestedMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    // Check if matchmaking is enabled
    const matchEnabledSetting = await prisma.systemSetting.findUnique({ where: { key: "matchmaking_enabled" } });
    if (matchEnabledSetting && matchEnabledSetting.value === false) {
      return res.json({ matches: [], total: 0, page, limit, totalPages: 0 });
    }

    // Check browsing limits for free users
    const browseStatus = await canBrowseMore(userId);
    if (!browseStatus.allowed) {
      return res.status(403).json({
        error: "You have reached your daily browsing limit. Upgrade to Gold or Platinum for unlimited browsing.",
        limit: browseStatus.limit,
        used: browseStatus.limit - browseStatus.remaining,
      });
    }

    const features = await getUserFeatures(userId);

    const effectiveLimit = limit;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            spousePreference: true,
            health_info: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      return res.json({ matches: [], total: 0, page, limit: effectiveLimit, totalPages: 0, needsProfile: true });
    }

    const oppositeGender = user.gender === "male" ? "female" : "male";

    // Exclude users we've already interacted with (liked, matched, rejected)
    const existingMatches = await prisma.match.findMany({
      where: { userId },
      select: { matchedUserId: true },
    });
    const matchUserIds = existingMatches.map((m) => m.matchedUserId);

    // Exclude users we've already viewed (seen in match page)
    const viewedProfiles = await prisma.profileView.findMany({
      where: { viewerId: userId },
      select: { viewedId: true },
    });
    const viewedUserIds = viewedProfiles.map((v) => v.viewedId);

    const excludeIds = [...new Set([...matchUserIds, ...viewedUserIds])];

    const where = {
      gender: oppositeGender,
      isActive: true,
      id: { notIn: [userId, ...excludeIds] },
      profile: { isNot: null },
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: effectiveLimit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          gender: true,
          dateOfBirth: true,
          isVerified: true,
          profile: {
            include: {
              spousePreference: true,
              health_info: true,
            },
          },
          subscriptions: {
            where: { status: "active", endDate: { gte: new Date() } },
            select: { planType: true, status: true, endDate: true },
            take: 1,
          },
        },
      }),
    ]);

    if (users.length === 0) {
      return res.json({ matches: [], total: 0, page, limit: effectiveLimit, totalPages: 0, browseLimit: browseStatus.limit, browseRemaining: browseStatus.remaining });
    }

    // Load dynamic category weights from DB (admin-configurable)
    _activeWeights = await getCategoryWeights();

    // Compute compatibility scores for each suggested match
    const matches = users.map((u) => {
      const compat = computeCompatibilityScore(user, u);
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        gender: u.gender,
        age: computeAge(u.dateOfBirth),
        city: u.profile?.city || null,
        country: u.profile?.country || null,
        occupation: u.profile?.occupation || null,
        educationLevel: u.profile?.educationLevel || null,
        maritalStatus: u.profile?.maritalStatus || null,
        religiousCommitment: u.profile?.religiousCommitment || null,
        bio: u.profile?.bio || null,
        photos: u.profile?.photos || [],
        selfDescription: u.profile?.selfDescription || null,
        height: u.profile?.height || null,
        smokingHabits: u.profile?.smokingHabits || null,
        childrenStatus: u.profile?.childrenStatus || null,
        isVerified: u.isVerified,
        membershipPlan: u.subscriptions?.length > 0 ? u.subscriptions[0].planType : null,
        isPremium: u.subscriptions?.length > 0,
        isVip: u.subscriptions?.length > 0 && u.subscriptions[0].planType === "platinum",
        hasPriorityVisibility: u.subscriptions?.length > 0 && (u.subscriptions[0].planType === "gold" || u.subscriptions[0].planType === "platinum"),
        compatibilityScore: compat.score,
        recommendationLevel: compat.recommendationLevel,
        strengths: compat.strengths,
        potentialDifferences: compat.potentialDifferences,
        compatibilityCategories: compat.categories,
      };
    });

    // Get minimum compatibility threshold from admin settings (default 0 — show all profiles)
    const minScoreSetting = await prisma.systemSetting.findUnique({ where: { key: "min_compatibility_score" } });
    const minScore = minScoreSetting && typeof minScoreSetting.value === "number" ? minScoreSetting.value : 0;

    // Filter out matches below the admin-configured compatibility threshold
    const filteredMatches = matches.filter((m) => m.compatibilityScore >= minScore);

    // Sort: priority visibility first, then by compatibility score
    filteredMatches.sort((a, b) => {
      if (a.hasPriorityVisibility && !b.hasPriorityVisibility) return -1;
      if (!a.hasPriorityVisibility && b.hasPriorityVisibility) return 1;
      return b.compatibilityScore - a.compatibilityScore;
    });

    res.json({
      matches: filteredMatches,
      total,
      page,
      limit: effectiveLimit,
      totalPages: Math.ceil(total / effectiveLimit),
      browseLimit: browseStatus.limit,
      browseRemaining: browseStatus.remaining,
    });
  } catch (error) {
    console.error("Get suggested matches error:", error);
    res.status(500).json({ error: "Failed to fetch suggested matches" });
  }
};

const getLikesReceived = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user has view_likes feature
    const features = await getUserFeatures(userId);
    const canViewLikes = features.includes("view_likes");

    let likes = await prisma.match.findMany({
      where: {
        matchedUserId: userId,
        status: "accepted",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isVerified: true,
            profile: {
              select: {
                photos: true,
                city: true,
                country: true,
                occupation: true,
              },
            },
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    likes = likes.filter((l) => l.user !== null).map((l) => {
      const plan = l.user.subscriptions?.length > 0 ? l.user.subscriptions[0].planType : null;
      delete l.user.subscriptions;
      return { ...l, user: { ...l.user, membershipPlan: plan, isPremium: !!plan } };
    });

    // Free users: only show count and first 2 likes (teaser), hide the rest
    if (!canViewLikes) {
      res.json({
        likes: likes.slice(0, 2),
        total: likes.length,
        locked: true,
        message: "Upgrade to Gold or Platinum to see all your likes.",
      });
    } else {
      res.json({ likes, total: likes.length, locked: false });
    }
  } catch (error) {
    console.error("Get likes received error:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
};

const getLikesSent = async (req, res) => {
  try {
    const userId = req.user.userId;

    let likes = await prisma.match.findMany({
      where: {
        userId,
        status: "accepted",
      },
      include: {
        matchedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isVerified: true,
            profile: {
              select: {
                photos: true,
                city: true,
                country: true,
                occupation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    likes = likes.filter((l) => l.matchedUser !== null);

    res.json({ likes, total: likes.length });
  } catch (error) {
    console.error("Get likes sent error:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
};

const getVisitors = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user has view_visitors feature
    const features = await getUserFeatures(userId);
    const canViewVisitors = features.includes("view_visitors");

    const { getProfileVisitors, getVisitorCount } = require("../utils/subscriptionHelper");
    const visitorCount = await getVisitorCount(userId);

    if (!canViewVisitors) {
      // Free users: show count only, lock the list
      return res.json({
        visitors: [],
        total: visitorCount,
        locked: true,
        message: "Upgrade to Gold or Platinum to see who viewed your profile.",
      });
    }

    const visitors = await getProfileVisitors(userId, 30);
    res.json({ visitors, total: visitorCount, locked: false });
  } catch (error) {
    console.error("Get visitors error:", error);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
};

module.exports = {
  getRecommendedMatches,
  searchProfiles,
  sendInterest,
  passProfile,
  respondToInterest,
  getMyMatches,
  getLikesReceived,
  getLikesSent,
  removeInterest,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  getSuggestedMatches,
  getVisitors,
  invalidateWeightsCache,
  getCategoryWeights,
};
