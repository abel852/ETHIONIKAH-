const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../config/storage");

router.post("/", authenticate, upload.fields([
  { name: "idPhoto", maxCount: 1 },
  { name: "selfiePhoto", maxCount: 1 },
]), verificationController.submitVerification);
router.get("/me", authenticate, verificationController.getVerificationStatus);
router.get("/:id", authenticate, verificationController.getVerificationById);
router.get("/admin/all", authenticate, authorize("admin"), verificationController.getAllVerifications);
router.post("/:id/approve", authenticate, authorize("admin"), verificationController.approveVerification);
router.post("/:id/reject", authenticate, authorize("admin"), verificationController.rejectVerification);

module.exports = router;
