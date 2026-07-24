const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

router.post("/", authenticate, reportController.createReport);
router.get("/admin/all", authenticate, authorize("admin"), reportController.getAllReports);
router.post("/mark-viewed", authenticate, authorize("admin"), reportController.markReportViewed);
router.get("/:id", authenticate, authorize("admin"), reportController.getReportById);
router.put("/:id/status", authenticate, authorize("admin"), reportController.updateReportStatus);
router.post("/:id/dismiss", authenticate, authorize("admin"), reportController.dismissReport);

module.exports = router;
