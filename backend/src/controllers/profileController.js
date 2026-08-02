const prisma = require("../config/database");
const { recordProfileView } = require("../utils/subscriptionHelper");
const { uploadMulterFile, deleteFromR2, isR2Enabled } = require("../config/r2");

const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    // Fields that belong to the User model but are locked after registration
    // gender, dateOfBirth, firstName, lastName cannot be changed via profile edit
    const lockedUserFields = ["gender", "dateOfBirth", "firstName", "lastName"];
    for (const field of lockedUserFields) {
      delete data[field];
    }

    // Only allow fields that exist in the Profile model
    const allowedFields = [
      "nationality", "region", "height", "weight", "appearance",
      "hasWali", "waliName", "waliPhone", "waliRelation", "waliEmail",
      "hasChildren", "childrenCount", "childrenCustody", "childrenStatus",
      "religiousCommitment", "prayerHabits", "quranReadingFrequency",
      "islamicClassesAttendance", "islamicTradition", "islamicTraditionOther",
      "islamicMatchPreference", "personalPreference",
      "educationLevel", "occupation", "employmentStatus", "monthlyIncomeRange",
      "reasonForJoining", "desiredMarriageTimeline", "childrenPreference",
      "ethnicBackground", "motherTongue", "familyInvolvement",
      "smokingHabits", "khatUsage", "exerciseHabits", "livingPreference",
      "selfDescription", "qualities", "interests", "bio",
      "country", "city", "maritalStatus", "religiousLevel",
      "ethnicity", "languages", "photos", "isProfileComplete",
    ];
    const cleanData = {};
    for (const key of allowedFields) {
      if (key in data) {
        // Skip empty strings for non-optional fields, keep null for optional ones
        if (data[key] === "" && key === "height") {
          cleanData[key] = null;
        } else if (data[key] === "" && key === "maritalStatus") {
          // maritalStatus is a required enum — skip empty string
          continue;
        } else if (data[key] !== "") {
          cleanData[key] = data[key];
        } else {
          // For other optional string fields, convert empty string to null
          cleanData[key] = null;
        }
      }
    }
    // Ensure height is Int or null
    if (cleanData.height !== null && cleanData.height !== undefined) {
      cleanData.height = Number(cleanData.height);
      if (isNaN(cleanData.height)) cleanData.height = null;
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...cleanData,
          isProfileComplete: cleanData.isProfileComplete !== undefined ? cleanData.isProfileComplete : existingProfile.isProfileComplete,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...cleanData,
        },
      });
    }

    // --- Wali ownership enforcement ---
    // Only female users may create, update, or delete Wali records.
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    const WALI_PROFILE_FIELDS = ["hasWali", "waliName", "waliPhone", "waliRelation", "waliEmail"];
    const waliFieldsPresent = WALI_PROFILE_FIELDS.some((f) => cleanData[f] !== undefined);

    if (currentUser && currentUser.gender !== "female" && waliFieldsPresent) {
      return res.status(403).json({
        error: "Wali information can only be set by female users.",
        code: "WALI_FEMALE_ONLY",
      });
    }

    if (currentUser && currentUser.gender === "female") {
      const existingWali = await prisma.wali.findUnique({
        where: { femaleUserId: userId },
      });

      const hasWaliYes = cleanData.hasWali && cleanData.hasWali.toLowerCase() === "yes";

      // Check if there's an active or pending Wali invitation linked to this Wali
      if (existingWali) {
        const activeInvitation = await prisma.waliInvitation.findFirst({
          where: {
            waliId: existingWali.id,
            status: { in: ["active", "pending_approval"] },
          },
        });

        if (activeInvitation && (hasWaliYes || !hasWaliYes)) {
          return res.status(403).json({
            error: "You cannot edit your Wali information while a Wali invitation is active or pending approval. Please revoke the Wali invitation first before making changes.",
            code: "WALI_INVITATION_ACTIVE",
          });
        }
      }

      if (hasWaliYes && cleanData.waliName) {
        // Create or update Wali record
        const waliData = {
          name: cleanData.waliName,
          relationship: cleanData.waliRelation || "OTHER",
          email: cleanData.waliEmail || "",
          phone: cleanData.waliPhone || "",
        };
        if (existingWali) {
          await prisma.wali.update({
            where: { femaleUserId: userId },
            data: waliData,
          });
        } else {
          await prisma.wali.create({
            data: { femaleUserId: userId, ...waliData },
          });
        }
      } else if (!hasWaliYes && existingWali) {
        // hasWali is "no" or removed — delete the Wali record
        await prisma.wali.delete({
          where: { femaleUserId: userId },
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    const userPhotos = await prisma.profile.findUnique({
      where: { userId },
      select: { photos: true },
    });

    if (updatedUser) {
      delete updatedUser.passwordHash;
      updatedUser.photos = userPhotos?.photos || [];
    }

    res.json({ message: "Profile updated successfully", profile, user: updatedUser });
    } catch (error) {
    console.error("Profile update error:", error.message || error);
    if (error.code) console.error("Error code:", error.code);
    if (error.meta) console.error("Error meta:", JSON.stringify(error.meta));
    res.status(500).json({ error: error.message || "Failed to update profile" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            username: true,
            gender: true,
            dateOfBirth: true,
            isVerified: true,
          },
        },
        spousePreference: true,
      },
    });

    const likesCount = await prisma.match.count({
      where: { matchedUserId: userId, status: "accepted" },
    });

    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, status: "active", endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    const membership = activeSubscription
      ? { isPremium: true, activePlan: activeSubscription.planType, expiresAt: activeSubscription.endDate }
      : { isPremium: false, activePlan: null, expiresAt: null };

    // Include Wali record for female users
    let wali = null;
    if (profile?.user?.gender === "female") {
      wali = await prisma.wali.findUnique({
        where: { femaleUserId: userId },
        select: { id: true, name: true, relationship: true, email: true, phone: true, createdAt: true, updatedAt: true },
      });
    }

    res.json({ profile: { ...(profile || {}), likesCount, membership, wali } });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            gender: true,
            dateOfBirth: true,
            isVerified: true,
            createdAt: true,
            isDeleted: true,
          },
        },
        spousePreference: true,
      },
    });

    if (!profile || profile.user.isDeleted) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Strip Wali details — only expose hasWali (yes/no) to other users
    const isOwner = req.user && req.user.userId === profile.userId;
    if (!isOwner) {
      delete profile.waliName;
      delete profile.waliPhone;
      delete profile.waliRelation;
      delete profile.waliEmail;
    }

    // Record profile view for visitor tracking
    if (req.user && req.user.userId !== profile.userId) {
      await recordProfileView(req.user.userId, profile.userId);
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get profile by ID error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            gender: true,
            dateOfBirth: true,
            isVerified: true,
            createdAt: true,
            isDeleted: true,
            subscriptions: { where: { status: "active", endDate: { gte: new Date() } }, select: { planType: true, status: true }, take: 1 },
          },
        },
        spousePreference: true,
      },
    });

    if (!profile || profile.user.isDeleted) {
      return res.status(404).json({ error: "Profile not found" });
    }

    profile.user.membershipPlan = profile.user.subscriptions?.length > 0 ? profile.user.subscriptions[0].planType : null;
    profile.user.isPremium = !!profile.user.membershipPlan;
    delete profile.user.subscriptions;

    // Strip Wali details — only expose hasWali (yes/no) to other users
    const isOwner = req.user && req.user.userId === userId;
    if (!isOwner) {
      delete profile.waliName;
      delete profile.waliPhone;
      delete profile.waliRelation;
      delete profile.waliEmail;
    }

    // Record profile view for visitor tracking
    if (req.user && req.user.userId !== userId) {
      await recordProfileView(req.user.userId, userId);
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get profile by user ID error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateProfileStep = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { step, data } = req.body;

    // --- Wali ownership enforcement ---
    const WALI_PROFILE_FIELDS = ["hasWali", "waliName", "waliPhone", "waliRelation", "waliEmail"];
    const waliFieldsPresent = WALI_PROFILE_FIELDS.some((f) => data && data[f] !== undefined);

    if (waliFieldsPresent) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true },
      });

      if (currentUser && currentUser.gender !== "female") {
        return res.status(403).json({
          error: "Wali information can only be set by female users.",
          code: "WALI_FEMALE_ONLY",
        });
      }
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId },
        data: { ...data },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...data,
        },
      });
    }

    res.json({ 
      message: `Step ${step} completed successfully`, 
      profile,
      completedStep: step 
    });
  } catch (error) {
    console.error("Profile step update error:", error);
    res.status(500).json({ error: "Failed to update profile step" });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    let photoUrl;

    if (isR2Enabled()) {
      photoUrl = await uploadMulterFile(req.file, "profile-photos");
    } else {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    let profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, photos: [photoUrl] },
      });
    } else {
      profile = await prisma.profile.update({
        where: { userId },
        data: { photos: [photoUrl, ...profile.photos] },
      });
    }

    res.json({ message: "Photo uploaded successfully", profile, photoUrl });
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { photoUrl } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        photos: profile.photos.filter((photo) => photo !== photoUrl),
      },
    });

    res.json({ message: "Photo deleted successfully", profile: updatedProfile });
  } catch (error) {
    console.error("Photo delete error:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
};

const setProfileComplete = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.profile.update({
      where: { userId },
      data: { isProfileComplete: true },
    });

    res.json({ message: "Profile marked as complete", profile });
  } catch (error) {
    console.error("Set profile complete error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

const getUserBanInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const ban = await prisma.userRestriction.findFirst({
      where: { userId, type: "ban", OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: { createdAt: "desc" },
    });
    if (!ban) return res.json({ banned: false });
    const now = Date.now();
    const remaining = ban.expiresAt ? Math.max(0, new Date(ban.expiresAt).getTime() - now) : null;
    const days = remaining ? Math.floor(remaining / (1000 * 60 * 60 * 24)) : null;
    const hours = remaining ? Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null;
    res.json({ banned: true, expiresAt: ban.expiresAt, remainingMs: remaining, remainingLabel: ban.expiresAt ? `${days}d ${hours}h` : "Permanent" });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};

const getUserBadgeCounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [unreadMessages, pendingMatchRequests] = await Promise.all([
      prisma.message.count({
        where: {
          receiverId: userId,
          isRead: false,
          sender: { role: { not: "admin" } },
        },
      }),
      prisma.match.count({ where: { matchedUserId: userId, status: "pending" } }),
    ]);
    res.json({ counts: { messages: unreadMessages, matches: pendingMatchRequests } });
  } catch (error) {
    console.error("User badge counts error:", error);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
};

const getWeather = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { city: true },
    });
    const city = profile?.city || "Addis Ababa";
    const conditions = ["Sunny", "Partly Cloudy", "Clear", "Light Rain"];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = city.toLowerCase().includes("addis") ? 22 : 25;
    const temp = baseTemp + Math.floor(Math.random() * 6 - 2);
    res.json({ temp, condition, city });
  } catch (error) {
    res.json({ temp: 22, condition: "Sunny", city: "Addis Ababa" });
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfile,
  getProfileById,
  getProfileByUserId,
  updateProfileStep,
  uploadPhoto,
  deletePhoto,
  setProfileComplete,
  getUserBanInfo,
  getUserBadgeCounts,
  getWeather,
};
