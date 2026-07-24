const prisma = require("../config/database");

const createOrUpdateSpousePreference = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    // Validate age range
    if (data.preferredAgeMin != null && (data.preferredAgeMin < 18 || data.preferredAgeMin > 120)) {
      return res.status(400).json({ error: "Minimum age must be between 18 and 120" });
    }
    if (data.preferredAgeMax != null && (data.preferredAgeMax < 18 || data.preferredAgeMax > 120)) {
      return res.status(400).json({ error: "Maximum age must be between 18 and 120" });
    }
    if (data.preferredAgeMin != null && data.preferredAgeMax != null && data.preferredAgeMax < data.preferredAgeMin) {
      return res.status(400).json({ error: "Maximum age cannot be less than minimum age" });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });
      const newProfile = await prisma.profile.create({
        data: { userId, isProfileComplete: false },
      });
      const preference = await prisma.spousePreference.create({
        data: { profileId: newProfile.id, ...data },
      });
      return res.json({ message: "Spouse preferences saved successfully", preference });
    }

    const existingPreference = await prisma.spousePreference.findUnique({
      where: { profileId: profile.id },
    });

    let preference;
    if (existingPreference) {
      preference = await prisma.spousePreference.update({
        where: { profileId: profile.id },
        data,
      });
    } else {
      preference = await prisma.spousePreference.create({
        data: {
          profileId: profile.id,
          ...data,
        },
      });
    }

    res.json({ message: "Spouse preferences updated successfully", preference });
  } catch (error) {
    console.error("Spouse preference update error:", error);
    res.status(500).json({ error: "Failed to update spouse preferences" });
  }
};

const getSpousePreference = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { spousePreference: true },
    });

    if (!profile) {
      return res.json({ spousePreference: null });
    }

    res.json({ spousePreference: profile.spousePreference });
  } catch (error) {
    console.error("Get spouse preference error:", error);
    res.status(500).json({ error: "Failed to fetch spouse preferences" });
  }
};

module.exports = {
  createOrUpdateSpousePreference,
  getSpousePreference,
};
