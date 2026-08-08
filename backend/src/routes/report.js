const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const adminAuth = [authenticate, authorize("admin"), requireAdmin2FA];

router.post("/", authenticate, reportController.createReport);

router.get("/admin/all", ...adminAuth, reportController.getAllReports);
router.post("/mark-viewed", ...adminAuth, reportController.markReportViewed);
router.get("/:id", ...adminAuth, reportController.getReportById);
router.put("/:id/status", ...adminAuth, reportController.updateReportStatus);
router.post("/:id/dismiss", ...adminAuth, reportController.dismissReport);

module.exports = router;
