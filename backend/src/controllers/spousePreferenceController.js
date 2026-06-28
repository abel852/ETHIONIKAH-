const prisma = require("../config/database");

const createOrUpdateSpousePreference = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found. Please complete your profile first." });
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
      return res.status(404).json({ error: "Profile not found" });
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
