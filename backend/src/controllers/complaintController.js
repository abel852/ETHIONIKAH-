const prisma = require("../config/database");
const { notifyAllAdmins } = require("../utils/notification");

const PREMIUM_PLANS = ["gold", "platinum", "premium"];

async function isPremiumUser(userId) {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return sub && PREMIUM_PLANS.includes(sub.planType.toLowerCase());
}

const createComplaint = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, description } = req.body;

    if (req.user.isActive === false) {
      const resolved = await prisma.complaint.findFirst({
        where: { userId, status: "resolved" },
      });
      if (resolved) return res.status(403).json({ error: "Your case has been reviewed and closed. Please wait for your account status to be updated." });
    }

    const isPremium = await isPremiumUser(userId);

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        subject,
        description,
        isPinned: isPremium,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (isPremium) {
      try {
        await notifyAllAdmins({
          type: "priority_complaint",
          title: "Priority Complaint from Premium User",
          body: `${complaint.user.firstName} ${complaint.user.lastName} (${complaint.user.email}): ${subject}`,
        });
      } catch (e) { console.error("[NOTIFY] Admin notification failed:", e.message); }
    }

    res.status(201).json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
};

const contactSupport = async (req, res) => {
  try {
    const { email, subject, description } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({ error: "Subject is required (min 3 characters)" });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: "Message is required (min 10 characters)" });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let isPinned = false;

    if (user) {
      isPinned = await isPremiumUser(user.id);
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId: user ? user.id : null,
        subject: subject.trim(),
        description: `[Contact from: ${email}] ${description.trim()}`,
        isPinned,
      },
      include: user ? {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      } : undefined,
    });

    try {
      await notifyAllAdmins({
        type: "contact_support",
        title: isPinned ? "Priority Contact from Premium User" : "New Contact Support Message",
        body: `${email}: ${subject}`,
      });
    } catch (e) { console.error("[NOTIFY] Admin notification failed:", e.message); }

    res.status(201).json({ message: "Your message has been sent to our support team. We will get back to you soon." });
  } catch (error) {
    console.error("Contact support error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            restrictions: {
              where: { type: "ban" },
              select: { type: true, reason: true, expiresAt: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.json({ complaints });
  } catch (error) {
    console.error("Get all complaints error:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.userId;
    const complaints = await prisma.complaint.findMany({
      where: { userId },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({ complaint });
  } catch (error) {
    console.error("Get complaint by ID error:", error);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
};

const respondToComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, status } = req.body;
    const adminId = req.user.userId;

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        adminResponse,
        ...(status ? { status } : {}),
        adminId,
      },
    });

    res.json({ message: "Response submitted successfully", complaint });
  } catch (error) {
    console.error("Respond to complaint error:", error);
    res.status(500).json({ error: "Failed to submit response" });
  }
};

const closeComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    const adminId = req.user.userId;

    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status: "resolved",
        adminResponse,
        adminId,
      },
    });

    res.json({ message: "Complaint closed", complaint });
  } catch (error) {
    console.error("Close complaint error:", error);
    res.status(500).json({ error: "Failed to close complaint" });
  }
};

const markComplaintViewed = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Complaint IDs required" });
    }
    await prisma.complaint.updateMany({
      where: { id: { in: ids }, viewed_at: null },
      data: { viewed_at: new Date() },
    });
    res.json({ message: "Complaints marked as viewed" });
  } catch (error) {
    console.error("Mark complaint viewed error:", error);
    res.status(500).json({ error: "Failed to mark complaints as viewed" });
  }
};

const reopenComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status: "open" },
    });
    res.json({ message: "Complaint reopened", complaint });
  } catch (error) {
    console.error("Reopen complaint error:", error);
    res.status(500).json({ error: "Failed to reopen complaint" });
  }
};

module.exports = {
  createComplaint,
  contactSupport,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  respondToComplaint,
  closeComplaint,
  markComplaintViewed,
  reopenComplaint,
};
