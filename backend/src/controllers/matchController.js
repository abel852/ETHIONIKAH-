const prisma = require("../config/database");

// ----- AI scoring helpers -----

const computeAge = (dob) => new Date().getFullYear() - new Date(dob).getFullYear();

const ageScore = (matchAge, pref) => {
  if (!pref) return 0;
  const { preferredAgeMin, preferredAgeMax } = pref;
  if (!preferredAgeMin || !preferredAgeMax) return 0;
  if (matchAge >= preferredAgeMin && matchAge <= preferredAgeMax) return 15;
  // partial credit for being close
  const mid = (preferredAgeMin + preferredAgeMax) / 2;
  const dist = Math.abs(matchAge - mid);
  const range = preferredAgeMax - preferredAgeMin || 10;
  return Math.max(0, Math.round(15 - (dist / range) * 15));
};

const exactMatch = (a, b) => (a && b && a === b) ? 1 : 0;

const getRecommendedMatches = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            spousePreference: true,
          },
        },
      },
    });

    if (!user.profile) {
      return res.status(400).json({ error: "Please complete your profile first" });
    }

    const { spousePreference } = user.profile;
    const oppositeGender = user.gender === "male" ? "female" : "male";

    const potentialMatches = await prisma.user.findMany({
      where: {
        gender: oppositeGender,
        isActive: true,
        profile: {
          isProfileComplete: true,
        },
        id: { not: userId },
      },
      include: {
        profile: {
          include: {
            spousePreference: true,
          },
        },
      },
      take: 100,
    });

    const scoredMatches = potentialMatches.map((match) => {
      const p = match.profile || {};
      const pref = spousePreference;
      const matchAge = computeAge(match.dateOfBirth);
      const breakdown = {};

      // --- Demographics (max 30) ---
      const age = ageScore(matchAge, pref);
      breakdown.age = age;
      let score = age;

      const countryMatch = exactMatch(p.country, pref?.preferredLocation);
      breakdown.country = countryMatch * 10;
      score += breakdown.country;

      const sameCountry = exactMatch(user.profile.country, p.country);
      breakdown.sameCountry = sameCountry * 5;
      score += breakdown.sameCountry;

      // --- Marriage Preferences (max 25) ---
      const maritalMatch = exactMatch(p.maritalStatus, pref?.preferredMaritalStatus);
      breakdown.maritalStatus = maritalMatch * 10;
      score += breakdown.maritalStatus;

      const religiousMatch = exactMatch(p.religiousCommitment, pref?.preferredReligiousCommitment);
      breakdown.religiousCommitment = religiousMatch * 8;
      score += breakdown.religiousCommitment;

      const eduMatch = exactMatch(p.educationLevel, pref?.preferredEducationLevel);
      breakdown.education = eduMatch * 7;
      score += breakdown.education;

      // --- Religious Compatibility (max 20) ---
      const prayerLevels = ["never", "sometimes", "most_prayers", "all_prayers"];
      const prayerIdx = prayerLevels.indexOf(p.prayerHabits || "");
      const quranLevels = ["never", "sometimes", "often", "daily"];
      const quranIdx = quranLevels.indexOf(p.quranReadingFrequency || "");
      breakdown.prayerHabits = prayerIdx >= 2 ? 10 : prayerIdx === 1 ? 5 : 0;
      breakdown.quranReading = quranIdx >= 2 ? 10 : quranIdx === 1 ? 5 : 0;
      score += breakdown.prayerHabits + breakdown.quranReading;

      // --- Lifestyle (max 15) ---
      breakdown.smoking = exactMatch(p.smokingHabits, "non_smoker") ? 5 :
                          exactMatch(p.smokingHabits, "occasional") ? 3 : 0;
      breakdown.childrenPref = exactMatch(p.childrenStatus, pref?.preferredMaritalStatus === "divorced" ? "has_children" : "no_children") ? 5 : 0;
      breakdown.familyInvolvement = p.familyInvolvement === pref?.waliInvolvement ? 5 : 0;
      score += breakdown.smoking + breakdown.childrenPref + breakdown.familyInvolvement;

      // --- Background (max 10) ---
      breakdown.ethnicity = exactMatch(p.ethnicBackground, user.profile.ethnicBackground) ? 5 : 0;
      breakdown.language = (p.languages || []).some((l) => (user.profile.languages || []).includes(l)) ? 5 : 0;
      score += breakdown.ethnicity + breakdown.language;

      // --- Verified bonus ---
      breakdown.verified = match.isVerified ? 5 : 0;
      score += breakdown.verified;

      // also incorporate what the match's own spousePreference says about the user
      const matchPref = p.spousePreference;
      let mutualScore = 0;
      if (matchPref) {
        const myAge = computeAge(user.dateOfBirth);
        mutualScore += ageScore(myAge, matchPref);
        mutualScore += exactMatch(user.profile.religiousCommitment, matchPref.preferredReligiousCommitment) * 5;
        mutualScore += exactMatch(user.profile.maritalStatus, matchPref.preferredMaritalStatus) * 5;
        mutualScore += exactMatch(user.profile.educationLevel, matchPref.preferredEducationLevel) * 5;
      }
      breakdown.mutual = Math.min(mutualScore, 25);

      const finalScore = Math.min(Math.round(score + breakdown.mutual), 100);

      // strip sensitive fields and attach score
      const { passwordHash, ...safe } = match;
      return {
        ...safe,
        compatibilityScore: finalScore,
        compatibilityBreakdown: breakdown,
      };
    });

    scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({ matches: scoredMatches.slice(0, 50) });
  } catch (error) {
    console.error("Get recommended matches error:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};

const searchProfiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      ageMin,
      ageMax,
      maritalStatus,
      educationLevel,
      country,
      city,
      religiousCommitment,
      isVerified,
    } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    const oppositeGender = user.gender === "male" ? "female" : "male";

    const where = {
      gender: oppositeGender,
      isActive: true,
      profile: {
        isProfileComplete: true,
      },
      id: { not: userId },
    };

    if (ageMin || ageMax) {
      where.profile = {
        ...where.profile,
        user: {
          dateOfBirth: {},
        },
      };
    }

    if (maritalStatus) {
      where.profile.maritalStatus = maritalStatus;
    }

    if (educationLevel) {
      where.profile.educationLevel = educationLevel;
    }

    if (country) {
      where.profile.country = country;
    }

    if (city) {
      where.profile.city = city;
    }

    if (religiousCommitment) {
      where.profile.religiousCommitment = religiousCommitment;
    }

    if (isVerified === "true") {
      where.isVerified = true;
    }

    const profiles = await prisma.user.findMany({
      where,
      include: {
        profile: {
          include: {
            spousePreference: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const profilesWithoutPassword = profiles.map(({ passwordHash, ...profile }) => profile);

    res.json({ profiles: profilesWithoutPassword });
  } catch (error) {
    console.error("Search profiles error:", error);
    res.status(500).json({ error: "Failed to search profiles" });
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
      return res.status(400).json({ error: "Interest already sent" });
    }

    const match = await prisma.match.create({
      data: {
        userId,
        matchedUserId,
        status: "pending",
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

    res.status(201).json({ message: "Interest sent successfully", match });
  } catch (error) {
    console.error("Send interest error:", error);
    res.status(500).json({ error: "Failed to send interest" });
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
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ favorites });
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

module.exports = {
  getRecommendedMatches,
  searchProfiles,
  sendInterest,
  respondToInterest,
  getMyMatches,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
};
