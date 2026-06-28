const prisma = require("../config/database");

const createReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reportedUserId, reason, description } = req.body;

    if (userId === reportedUserId) {
      return res.status(400).json({ error: "Cannot report yourself" });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        reportedUserId,
        reason,
        description,
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
};

const getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reports });
  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ report });
  } catch (error) {
    console.error("Get report by ID error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const adminId = req.user.userId;

    const report = await prisma.report.update({
      where: { id },
      data: {
        status,
        adminId,
        adminNote,
      },
    });

    res.json({ message: "Report status updated", report });
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({ error: "Failed to update report status" });
  }
};

const dismissReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    const adminId = req.user.userId;

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: "dismissed",
        adminId,
        adminNote,
      },
    });

    res.json({ message: "Report dismissed", report });
  } catch (error) {
    console.error("Dismiss report error:", error);
    res.status(500).json({ error: "Failed to dismiss report" });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  dismissReport,
};
