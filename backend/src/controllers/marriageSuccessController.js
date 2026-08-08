const prisma = require("../config/database");
const { uploadMulterFile, isR2Enabled } = require("../config/r2");
const { logAudit } = require("../utils/auditLogger");
const { createNotification } = require("../utils/notification");

// ============================================================
// Stage 1: Initiator requests "We're Getting Married"
// Requires an active exclusive partnership
// ============================================================
const requestMarriageSuccess = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find active partnership where user is a participant
    const partnership = await prisma.exclusivePartnership.findFirst({
      where: {
        OR: [
          { userAId: userId, status: "active" },
          { userBId: userId, status: "active" },
        ],
      },
    });

    if (!partnership) {
      return res.status(403).json({ error: "You need an active exclusive partnership to request marriage success." });
    }

    const partnerId = partnership.userAId === userId ? partnership.userBId : partnership.userAId;

    // Check if there's already a marriage success submission for this partnership
    const existing = await prisma.marriageSuccess.findFirst({
      where: {
        partnershipId: partnership.id,
        status: { notIn: ["rejected"] },
      },
    });

    if (existing) {
      return res.status(403).json({ error: "A marriage success submission already exists for this partnership." });
    }

    // Check if either user is already married
    const users = await prisma.user.findMany({
      where: { id: { in: [userId, partnerId] } },
      select: { id: true, isMarried: true },
    });

    if (users.some((u) => u.isMarried)) {
      return res.status(403).json({ error: "One of you is already marked as married." });
    }

    const submission = await prisma.marriageSuccess.create({
      data: {
        partnershipId: partnership.id,
        initiatorId: userId,
        partnerId,
        status: "pending_partner_confirm",
        initiatorConfirmed: true,
        partnerConfirmed: false,
      },
    });

    // Notify the partner
    const initiator = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    await createNotification({ userId: partnerId, type: "marriage_success_request", title: "Marriage Success Request", body: `${initiator?.firstName} ${initiator?.lastName} wants to share your marriage success story!` });

    res.status(201).json({ message: "Marriage success request sent", submission });
  } catch (error) {
    console.error("Request marriage success error:", error);
    res.status(500).json({ error: "Failed to send marriage success request" });
  }
};

// ============================================================
// Stage 2: Partner confirms the marriage success request
// ============================================================
const confirmMarriageSuccess = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { submissionId } = req.params;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.partnerId !== userId) {
      return res.status(403).json({ error: "Only the partner can confirm this request." });
    }

    if (submission.status !== "pending_partner_confirm") {
      return res.status(400).json({ error: "This submission is not awaiting partner confirmation." });
    }

    const updated = await prisma.marriageSuccess.update({
      where: { id: submissionId },
      data: {
        partnerConfirmed: true,
        status: "pending_upload",
      },
    });

    // Notify the initiator
    await createNotification({ userId: submission.initiatorId, type: "marriage_success_confirmed", title: "Marriage Success Confirmed", body: "Your partner has confirmed! You can now upload your marriage photos." });

    res.json({ message: "Marriage success confirmed", submission: updated });
  } catch (error) {
    console.error("Confirm marriage success error:", error);
    res.status(500).json({ error: "Failed to confirm marriage success request" });
  }
};

// ============================================================
// Stage 3: Upload marriage photos + optional certificate + story
// Either partner can upload
// ============================================================
const uploadMarriagePhotos = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { submissionId } = req.params;
    const { successStory, consentToPublish } = req.body;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.initiatorId !== userId && submission.partnerId !== userId) {
      return res.status(403).json({ error: "You are not part of this submission." });
    }

    if (submission.status !== "pending_upload") {
      return res.status(400).json({ error: "This submission is not in the upload phase." });
    }

    // Process uploaded files
    const weddingPhotos = [];
    const engagementPhotos = [];
    const ringPhotos = [];
    let marriageCertificate = null;

    // req.files is an object with field names as keys (multer fields)
    if (req.files) {
      const uploadFile = async (file, folder) => {
        if (isR2Enabled()) {
          return await uploadMulterFile(file, folder);
        }
        return `/uploads/${folder}/${file.filename}`;
      };

      if (req.files.weddingPhotos) {
        for (const f of req.files.weddingPhotos) {
          weddingPhotos.push(await uploadFile(f, "marriage-photos"));
        }
      }
      if (req.files.engagementPhotos) {
        for (const f of req.files.engagementPhotos) {
          engagementPhotos.push(await uploadFile(f, "marriage-photos"));
        }
      }
      if (req.files.ringPhotos) {
        for (const f of req.files.ringPhotos) {
          ringPhotos.push(await uploadFile(f, "marriage-photos"));
        }
      }
      if (req.files.marriageCertificate && req.files.marriageCertificate[0]) {
        marriageCertificate = await uploadFile(req.files.marriageCertificate[0], "marriage-certificates");
      }
    }

    const updated = await prisma.marriageSuccess.update({
      where: { id: submissionId },
      data: {
        weddingPhotos: { set: weddingPhotos },
        engagementPhotos: { set: engagementPhotos },
        ringPhotos: { set: ringPhotos },
        marriageCertificate,
        successStory: successStory || null,
        consentToPublish: consentToPublish === "true" || consentToPublish === true,
        status: "pending_admin_review",
      },
    });

    // Notify both users
    await createNotification({ userId: submission.initiatorId, type: "marriage_success_submitted", title: "Marriage Success Submitted", body: "Your marriage success photos have been submitted for admin review." });
    await createNotification({ userId: submission.partnerId, type: "marriage_success_submitted", title: "Marriage Success Submitted", body: "Your marriage success photos have been submitted for admin review." });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "admin", isActive: true },
      select: { id: true },
    });
    for (const admin of admins) {
      await createNotification({ userId: admin.id, type: "marriage_success_review", title: "Marriage Success Review", body: "A new marriage success submission is awaiting review." });
    }

    res.json({ message: "Photos uploaded and submitted for review", submission: updated });
  } catch (error) {
    console.error("Upload marriage photos error:", error);
    res.status(500).json({ error: "Failed to upload marriage photos" });
  }
};

// ============================================================
// Get my marriage success submission(s)
// ============================================================
const getMyMarriageSuccess = async (req, res) => {
  try {
    const userId = req.user.userId;

    const submissions = await prisma.marriageSuccess.findMany({
      where: {
        OR: [{ initiatorId: userId }, { partnerId: userId }],
      },
      include: {
        partnership: true,
        initiator: { select: { id: true, firstName: true, lastName: true } },
        partner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ submissions });
  } catch (error) {
    console.error("Get my marriage success error:", error);
    res.status(500).json({ error: "Failed to get marriage success submissions" });
  }
};

// ============================================================
// Get a single marriage success submission
// ============================================================
const getMarriageSuccess = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { submissionId } = req.params;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
      include: {
        partnership: true,
        initiator: { select: { id: true, firstName: true, lastName: true } },
        partner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Only allow participants or admins to view
    if (submission.initiatorId !== userId && submission.partnerId !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ submission });
  } catch (error) {
    console.error("Get marriage success error:", error);
    res.status(500).json({ error: "Failed to get submission" });
  }
};

// ============================================================
// Cancel a marriage success request (only in early stages)
// ============================================================
const cancelMarriageSuccess = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { submissionId } = req.params;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.initiatorId !== userId && submission.partnerId !== userId) {
      return res.status(403).json({ error: "You are not part of this submission." });
    }

    if (!["pending_partner_confirm", "pending_upload"].includes(submission.status)) {
      return res.status(400).json({ error: "Cannot cancel a submission that is under review or already approved." });
    }

    await prisma.marriageSuccess.delete({
      where: { id: submissionId },
    });

    // Notify the other partner
    const otherId = submission.initiatorId === userId ? submission.partnerId : submission.initiatorId;
    await createNotification({ userId: otherId, type: "marriage_success_cancelled", title: "Marriage Success Cancelled", body: "The marriage success submission has been cancelled." });

    res.json({ message: "Submission cancelled" });
  } catch (error) {
    console.error("Cancel marriage success error:", error);
    res.status(500).json({ error: "Failed to cancel submission" });
  }
};

// ============================================================
// ADMIN: Get all marriage success submissions
// ============================================================
const adminGetSubmissions = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const submissions = await prisma.marriageSuccess.findMany({
      where,
      include: {
        initiator: { select: { id: true, firstName: true, lastName: true, email: true } },
        partner: { select: { id: true, firstName: true, lastName: true, email: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ submissions });
  } catch (error) {
    console.error("Admin get submissions error:", error);
    res.status(500).json({ error: "Failed to get submissions" });
  }
};

// ============================================================
// ADMIN: Get a single submission with full details
// ============================================================
const adminGetSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
      include: {
        partnership: {
          include: {
            userA: { select: { id: true, firstName: true, lastName: true, email: true, isMarried: true } },
            userB: { select: { id: true, firstName: true, lastName: true, email: true, isMarried: true } },
          },
        },
        initiator: { select: { id: true, firstName: true, lastName: true, email: true, isMarried: true } },
        partner: { select: { id: true, firstName: true, lastName: true, email: true, isMarried: true } },
        admin: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({ submission });
  } catch (error) {
    console.error("Admin get submission error:", error);
    res.status(500).json({ error: "Failed to get submission" });
  }
};

// ============================================================
// ADMIN: Approve a marriage success submission
// - Marks both users as married
// - Disables matching, messaging, likes, partnership requests
// - Hides profiles from discovery
// ============================================================
const adminApproveSubmission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { submissionId } = req.params;
    const { adminNote } = req.body;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.status !== "pending_admin_review") {
      return res.status(400).json({ error: "This submission is not pending review." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update submission
      const updated = await tx.marriageSuccess.update({
        where: { id: submissionId },
        data: {
          status: "approved",
          adminId,
          adminNote: adminNote || null,
          reviewedAt: new Date(),
        },
      });

      // Mark both users as married
      await tx.user.update({
        where: { id: submission.initiatorId },
        data: { isMarried: true, marriedAt: new Date() },
      });
      await tx.user.update({
        where: { id: submission.partnerId },
        data: { isMarried: true, marriedAt: new Date() },
      });

      // Update both profiles' maritalStatus to "married" and hide from discovery
      await tx.profile.updateMany({
        where: { userId: { in: [submission.initiatorId, submission.partnerId] } },
        data: { maritalStatus: "married" },
      });

      // End the exclusive partnership (mark as ended since they're now married)
      await tx.exclusivePartnership.update({
        where: { id: submission.partnershipId },
        data: { status: "ended", endedAt: new Date() },
      });

      return updated;
    });

    // Notify both users
    await createNotification({ userId: submission.initiatorId, type: "marriage_success_approved", title: "Marriage Success Approved! 🎉", body: "Congratulations! Your marriage success has been approved. Visit your dashboard to see your congratulations page." });
    await createNotification({ userId: submission.partnerId, type: "marriage_success_approved", title: "Marriage Success Approved! 🎉", body: "Congratulations! Your marriage success has been approved. Visit your dashboard to see your congratulations page." });

    // Audit log
    await logAudit({ actorId: adminId, action: "APPROVE_MARRIAGE_SUCCESS", resource: "marriage_success", resourceId: submissionId, details: { adminNote } });

    res.json({ message: "Marriage success approved", submission: result });
  } catch (error) {
    console.error("Admin approve submission error:", error);
    res.status(500).json({ error: "Failed to approve submission" });
  }
};

// ============================================================
// ADMIN: Reject a marriage success submission
// ============================================================
const adminRejectSubmission = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { submissionId } = req.params;
    const { adminNote } = req.body;

    const submission = await prisma.marriageSuccess.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (!["pending_admin_review"].includes(submission.status)) {
      return res.status(400).json({ error: "This submission cannot be rejected at its current stage." });
    }

    const updated = await prisma.marriageSuccess.update({
      where: { id: submissionId },
      data: {
        status: "rejected",
        adminId,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    });

    // Notify both users
    const reason = adminNote ? ` Reason: ${adminNote}` : "";
    await createNotification({ userId: submission.initiatorId, type: "marriage_success_rejected", title: "Marriage Success Update", body: `Your marriage success submission was not approved.${reason} You can resubmit with updated photos.` });
    await createNotification({ userId: submission.partnerId, type: "marriage_success_rejected", title: "Marriage Success Update", body: `Your marriage success submission was not approved.${reason} You can resubmit with updated photos.` });

    // Audit log
    await logAudit({ actorId: adminId, action: "REJECT_MARRIAGE_SUCCESS", resource: "marriage_success", resourceId: submissionId, details: { adminNote } });

    res.json({ message: "Submission rejected", submission: updated });
  } catch (error) {
    console.error("Admin reject submission error:", error);
    res.status(500).json({ error: "Failed to reject submission" });
  }
};

// ============================================================
// POST-APPROVAL: Archive account (hide profile, keep account)
// ============================================================
const archiveAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isMarried) return res.status(403).json({ error: "Only married users can archive their account." });

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Also ensure profile is hidden
    await prisma.profile.updateMany({
      where: { userId },
      data: { isProfileComplete: false },
    });

    res.json({ message: "Account archived successfully" });
  } catch (error) {
    console.error("Archive account error:", error);
    res.status(500).json({ error: "Failed to archive account" });
  }
};

// ============================================================
// POST-APPROVAL: Permanently delete account (requires password + OTP)
// Step 1: Verify password and send OTP
// ============================================================
const deleteAccountVerifyPassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isMarried) return res.status(403).json({ error: "Only married users can delete their account." });

    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Incorrect password" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: otp, phoneOtpExpiry: otpExpiry },
    });

    // Send OTP via notification (in production, send via SMS/email)
    await createNotification({ userId, type: "account_deletion_otp", title: "Account Deletion Code", body: `Your verification code is: ${otp}` });

    res.json({ message: "Password verified. OTP sent to your phone." });
  } catch (error) {
    console.error("Delete account verify password error:", error);
    res.status(500).json({ error: "Failed to verify password" });
  }
};

// ============================================================
// POST-APPROVAL: Permanently delete account
// Step 2: Confirm with OTP and delete
// ============================================================
const deleteAccountConfirm = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isMarried) return res.status(403).json({ error: "Only married users can delete their account." });

    if (!user.phoneOtp || !user.phoneOtpExpiry) {
      return res.status(400).json({ error: "Please request a verification code first." });
    }

    if (new Date() > user.phoneOtpExpiry) {
      return res.status(400).json({ error: "Verification code expired. Please try again." });
    }

    if (user.phoneOtp !== otp) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    // Soft delete the account
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        isActive: false,
        phoneOtp: null,
        phoneOtpExpiry: null,
      },
    });

    res.json({ message: "Account permanently deleted" });
  } catch (error) {
    console.error("Delete account confirm error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// ============================================================
// PUBLIC: Get published success stories
// ============================================================
const getPublishedSuccessStories = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [stories, total] = await Promise.all([
      prisma.marriageSuccess.findMany({
        where: {
          status: "approved",
          consentToPublish: true,
          successStory: { not: null },
        },
        select: {
          id: true,
          weddingPhotos: true,
          engagementPhotos: true,
          ringPhotos: true,
          successStory: true,
          createdAt: true,
          initiator: { select: { firstName: true, lastName: true } },
          partner: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.marriageSuccess.count({
        where: {
          status: "approved",
          consentToPublish: true,
          successStory: { not: null },
        },
      }),
    ]);

    res.json({ stories, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error("Get published success stories error:", error);
    res.status(500).json({ error: "Failed to get success stories" });
  }
};

module.exports = {
  requestMarriageSuccess,
  confirmMarriageSuccess,
  uploadMarriagePhotos,
  getMyMarriageSuccess,
  getMarriageSuccess,
  cancelMarriageSuccess,
  adminGetSubmissions,
  adminGetSubmission,
  adminApproveSubmission,
  adminRejectSubmission,
  archiveAccount,
  deleteAccountVerifyPassword,
  deleteAccountConfirm,
  getPublishedSuccessStories,
};
