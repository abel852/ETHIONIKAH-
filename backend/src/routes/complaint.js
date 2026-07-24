const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticate, authorize } = require("../middleware/auth");
const { contactLimiter } = require("../middleware/rateLimiter");

router.post("/contact", contactLimiter, complaintController.contactSupport);
router.post("/", authenticate, complaintController.createComplaint);
router.post("/mark-viewed", authenticate, authorize("admin"), complaintController.markComplaintViewed);
router.get("/me", authenticate, complaintController.getMyComplaints);
router.get("/admin/all", authenticate, authorize("admin"), complaintController.getAllComplaints);
router.get("/:id", authenticate, authorize("admin"), complaintController.getComplaintById);
router.post("/:id/respond", authenticate, authorize("admin"), complaintController.respondToComplaint);
router.post("/:id/close", authenticate, authorize("admin"), complaintController.closeComplaint);
router.post("/:id/reopen", authenticate, authorize("admin"), complaintController.reopenComplaint);

module.exports = router;
