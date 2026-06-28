const prisma = require("../config/database");

const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = req.body;

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...data,
          isProfileComplete: data.isProfileComplete !== undefined ? data.isProfileComplete : existingProfile.isProfileComplete,
        },
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          userId,
          ...data,
        },
      });
    }

    res.json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
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
            gender: true,
            dateOfBirth: true,
            isVerified: true,
          },
        },
        spousePreference: true,
      },
    });

    res.json({ profile: profile || {} });
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
            gender: true,
            dateOfBirth: true,
            isVerified: true,
            createdAt: true,
          },
        },
        spousePreference: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ profile });
  } catch (error) {
    console.error("Get profile by ID error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateProfileStep = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { step, data } = req.body;

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

    const photoUrl = `/uploads/${req.file.filename}`;

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

module.exports = {
  createOrUpdateProfile,
  getProfile,
  getProfileById,
  updateProfileStep,
  uploadPhoto,
  deletePhoto,
  setProfileComplete,
};
