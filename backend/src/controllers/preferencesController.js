const prisma = require("../config/database");

const SUPPORTED_LANGS = ["en", "am", "ar", "om"];

const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { language, emailNotifications } = req.body;

    const updateData = {};

    if (language !== undefined) {
      if (!SUPPORTED_LANGS.includes(language)) {
        return res.status(400).json({ error: "Unsupported language" });
      }
      updateData.language = language;
    }

    if (emailNotifications !== undefined) {
      updateData.emailNotifications = Boolean(emailNotifications);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true, emailNotifications: true },
    });

    res.json({
      message: "Preferences updated",
      language: user.language,
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

const getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true, emailNotifications: true },
    });
    res.json({
      language: user.language,
      emailNotifications: user.emailNotifications,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: "Failed to get preferences" });
  }
};

module.exports = { updatePreferences, getPreferences };
