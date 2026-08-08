const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const { contactLimiter } = require("../middleware/rateLimiter");
const adminAuth = [authenticate, authorize("admin"), requireAdmin2FA];

router.post("/contact", contactLimiter, complaintController.contactSupport);
router.post("/", authenticate, complaintController.createComplaint);

router.post("/mark-viewed", ...adminAuth, complaintController.markComplaintViewed);
router.get("/me", authenticate, complaintController.getMyComplaints);
router.get("/admin/all", ...adminAuth, complaintController.getAllComplaints);
router.get("/:id", ...adminAuth, complaintController.getComplaintById);
router.post("/:id/respond", ...adminAuth, complaintController.respondToComplaint);
router.post("/:id/close", ...adminAuth, complaintController.closeComplaint);
router.post("/:id/reopen", ...adminAuth, complaintController.reopenComplaint);

module.exports = router;
