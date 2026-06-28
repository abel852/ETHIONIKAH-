const prisma = require("../config/database");

const createComplaint = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, description } = req.body;

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        subject,
        description,
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

    res.status(201).json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Failed to submit complaint" });
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
      orderBy: { createdAt: "desc" },
    });

    res.json({ complaints });
  } catch (error) {
    console.error("Get all complaints error:", error);
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
        status: status || "resolved",
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

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  respondToComplaint,
  closeComplaint,
};
