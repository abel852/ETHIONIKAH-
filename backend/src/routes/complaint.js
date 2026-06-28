const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { authenticate, authorize } = require("../middleware/auth");

router.post("/", authenticate, complaintController.createComplaint);
router.get("/admin/all", authenticate, authorize("admin"), complaintController.getAllComplaints);
router.get("/:id", authenticate, complaintController.getComplaintById);
router.post("/:id/respond", authenticate, authorize("admin"), complaintController.respondToComplaint);
router.post("/:id/close", authenticate, authorize("admin"), complaintController.closeComplaint);

module.exports = router;
