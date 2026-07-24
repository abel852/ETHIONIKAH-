const prisma = require("../config/database");
const { encrypt, decrypt } = require("../utils/encryption");

const encryptFields = (data) => ({
  hivStatus: encrypt(data.hivStatus),
  stdStatus: encrypt(data.stdStatus),
  stdDetails: encrypt(data.stdDetails),
  hereditaryDiseases: encrypt(data.hereditaryDiseases),
  hereditaryDetails: encrypt(data.hereditaryDetails),
  chronicConditions: encrypt(data.chronicConditions),
  chronicDetails: encrypt(data.chronicDetails),
  disabilities: encrypt(data.disabilities),
  disabilityDetails: encrypt(data.disabilityDetails),
  otherConditions: encrypt(data.otherConditions),
});

const decryptFields = (record) => {
  if (!record) return null;
  return {
    ...record,
    hivStatus: decrypt(record.hivStatus),
    stdStatus: decrypt(record.stdStatus),
    stdDetails: decrypt(record.stdDetails),
    hereditaryDiseases: decrypt(record.hereditaryDiseases),
    hereditaryDetails: decrypt(record.hereditaryDetails),
    chronicConditions: decrypt(record.chronicConditions),
    chronicDetails: decrypt(record.chronicDetails),
    disabilities: decrypt(record.disabilities),
    disabilityDetails: decrypt(record.disabilityDetails),
    otherConditions: decrypt(record.otherConditions),
  };
};

exports.saveHealthInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const {
      hivStatus, stdStatus, stdDetails,
      hereditaryDiseases, hereditaryDetails,
      chronicConditions, chronicDetails,
      disabilities, disabilityDetails, otherConditions,
      shareWithMatches,
      hivMatchPreference, stdMatchPreference,
      hereditaryMatchPreference, healthMatchPreference,
    } = req.body;

    const encrypted = encryptFields({
      hivStatus, stdStatus, stdDetails,
      hereditaryDiseases, hereditaryDetails,
      chronicConditions, chronicDetails,
      disabilities, disabilityDetails, otherConditions,
    });

    const healthInfo = await prisma.healthInfo.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        ...encrypted,
        shareWithMatches: shareWithMatches ?? false,
        hivMatchPreference: hivMatchPreference ?? "any",
        stdMatchPreference: stdMatchPreference ?? "any",
        hereditaryMatchPreference: hereditaryMatchPreference ?? "any",
        healthMatchPreference: healthMatchPreference ?? "any",
      },
      update: {
        ...encrypted,
        shareWithMatches: shareWithMatches ?? false,
        hivMatchPreference: hivMatchPreference ?? "any",
        stdMatchPreference: stdMatchPreference ?? "any",
        hereditaryMatchPreference: hereditaryMatchPreference ?? "any",
        healthMatchPreference: healthMatchPreference ?? "any",
      },
    });

    res.json({ message: "Health information saved", healthInfo: decryptFields(healthInfo) });
  } catch (error) {
    console.error("Save health info error:", error);
    res.status(500).json({ error: "Failed to save health information" });
  }
};

exports.getHealthInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const healthInfo = await prisma.healthInfo.findUnique({
      where: { profileId: profile.id },
    });

    res.json({ healthInfo: decryptFields(healthInfo) });
  } catch (error) {
    console.error("Get health info error:", error);
    res.status(500).json({ error: "Failed to fetch health information" });
  }
};

exports.getPublicHealthInfo = async (req, res) => {
  try {
    const { profileId } = req.params;
    const viewerId = req.user?.userId;

    const healthInfo = await prisma.healthInfo.findUnique({
      where: { profileId },
    });

    if (!healthInfo) return res.json({ healthInfo: null });
    if (!healthInfo.shareWithMatches) return res.json({ healthInfo: null });

    const decrypted = decryptFields(healthInfo);
    const viewerProfile = viewerId ? await prisma.profile.findUnique({ where: { userId: viewerId } }) : null;
    const viewerHealth = viewerProfile ? await prisma.healthInfo.findUnique({ where: { profileId: viewerProfile.id } }) : null;

    let visible = {};
    if (viewerHealth?.shareWithMatches) {
      const viewerDecrypted = decryptFields(viewerHealth);
      if (decrypted.hivStatus && viewerDecrypted.hivStatus) visible.hivStatus = decrypted.hivStatus;
      if (decrypted.stdStatus && viewerDecrypted.stdStatus) { visible.stdStatus = decrypted.stdStatus; visible.stdDetails = decrypted.stdDetails; }
      if (decrypted.hereditaryDiseases && viewerDecrypted.hereditaryDiseases) { visible.hereditaryDiseases = decrypted.hereditaryDiseases; visible.hereditaryDetails = decrypted.hereditaryDetails; }
      if (decrypted.chronicConditions && viewerDecrypted.chronicConditions) { visible.chronicConditions = decrypted.chronicConditions; visible.chronicDetails = decrypted.chronicDetails; }
      if (decrypted.disabilities && viewerDecrypted.disabilities) { visible.disabilities = decrypted.disabilities; visible.disabilityDetails = decrypted.disabilityDetails; }
      if (decrypted.otherConditions && viewerDecrypted.otherConditions) visible.otherConditions = decrypted.otherConditions;
    }

    res.json({ healthInfo: Object.keys(visible).length > 0 ? visible : null });
  } catch (error) {
    console.error("Get public health info error:", error);
    res.status(500).json({ error: "Failed to fetch health information" });
  }
};

exports.deleteHealthInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    await prisma.healthInfo.deleteMany({ where: { profileId: profile.id } });

    res.json({ message: "Health information removed" });
  } catch (error) {
    console.error("Delete health info error:", error);
    res.status(500).json({ error: "Failed to remove health information" });
  }
};
