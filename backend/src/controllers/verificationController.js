const prisma = require("../config/database");
const { createNotification, notifyAllAdmins } = require("../utils/notification");

const submitVerification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const idPhoto = req.files?.idPhoto?.[0];
    const selfiePhoto = req.files?.selfiePhoto?.[0];

    if (!idPhoto) return res.status(400).json({ error: "National ID photo is required" });
    if (!selfiePhoto) return res.status(400).json({ error: "Selfie photo is required" });

    const idDocumentPath = `uploads/national-ids/${idPhoto.filename}`;
    const selfiePath = `uploads/selfies/${selfiePhoto.filename}`;

    const existing = await prisma.verification.findUnique({ where: { userId } });

    let verification;
    if (existing) {
      verification = await prisma.verification.update({
        where: { userId },
        data: { idDocumentPath, selfiePath, status: "pending", adminId: null, adminNote: null, reviewedAt: null },
      });
    } else {
      verification = await prisma.verification.create({
        data: { userId, idDocumentPath, selfiePath, status: "pending" },
      });
    }

    notifyAllAdmins({
      type: "verification", title: "New Verification Request",
      body: `User ${req.user.userId} submitted verification documents for review.`,
    }).catch((e) => console.error("Notification error:", e));

    res.json({ message: "Verification submitted for review", verification });
  } catch (error) {
    console.error("Verification submission error:", error);
    res.status(500).json({ error: "Failed to submit verification" });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const verification = await prisma.verification.findUnique({
      where: { userId },
      include: {
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!verification) {
      return res.status(404).json({ error: "No verification submission found" });
    }

    res.json({ verification });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({ error: "Failed to fetch verification status" });
  }
};

const getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await prisma.verification.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!verification) return res.status(404).json({ error: "Verification not found" });
    res.json({ verification });
  } catch (error) {
    console.error("Get verification by ID error:", error);
    res.status(500).json({ error: "Failed to fetch verification" });
  }
};

const getAllVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const verifications = await prisma.verification.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ verifications });
  } catch (error) {
    console.error("Get all verifications error:", error);
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
};

const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user.userId;

    const verification = await prisma.verification.update({
      where: { id },
      data: { status: "approved", adminId, adminNote, reviewedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    createNotification({
      userId: verification.userId, type: "verification", title: "Verification Approved",
      body: "Your verification documents have been approved. You are now a verified user!",
    }).catch((e) => console.error("Notification error:", e));

    res.json({ message: "Verification approved", verification });
  } catch (error) {
    console.error("Approve verification error:", error);
    res.status(500).json({ error: "Failed to approve verification" });
  }
};

const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user.userId;

    const verification = await prisma.verification.update({
      where: { id },
      data: { status: "rejected", adminId, adminNote, reviewedAt: new Date() },
    });

    createNotification({
      userId: verification.userId, type: "verification", title: "Verification Rejected",
      body: adminNote
        ? `Your verification was rejected. Reason: ${adminNote}`
        : "Your verification documents were rejected. Please submit new documents.",
    }).catch((e) => console.error("Notification error:", e));

    res.json({ message: "Verification rejected", verification });
  } catch (error) {
    console.error("Reject verification error:", error);
    res.status(500).json({ error: "Failed to reject verification" });
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getVerificationById,
  getAllVerifications,
  approveVerification,
  rejectVerification,
};
