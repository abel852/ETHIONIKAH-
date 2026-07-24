const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");
const { authenticate, authorize, requireActive } = require("../middleware/auth");
const upload = require("../config/storage");
const { verifyUpload } = require("../middleware/uploadSecurity");

// Verify each uploaded file after multer saves it
const verifyVerificationUploads = (req, res, next) => {
  const fields = ["idPhoto", "selfiePhoto"];
  for (const field of fields) {
    if (req.files && req.files[field]) {
      for (const file of req.files[field]) {
        req.file = file;
        const verifier = verifyUpload(field);
        // Run verification synchronously by calling the logic directly
        const path = require("path");
        const fs = require("fs");
        const { logUpload } = require("../utils/uploadLogger");
        const { FIELD_CONFIG, BLOCKED_EXTENSIONS } = require("../middleware/uploadSecurity");
        const config = FIELD_CONFIG[field];
        const ext = path.extname(file.originalname).toLowerCase();

        if (BLOCKED_EXTENSIONS.includes(ext)) {
          logUpload(req, file, "blocked", `Blocked extension: ${ext}`);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(400).json({ error: "This file type is not allowed for security reasons." });
        }
        if (config && !config.exts.includes(ext)) {
          logUpload(req, file, "blocked", `Extension ${ext} not allowed for field ${field}`);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(400).json({ error: `File type ${ext} is not allowed. Allowed: ${config.exts.join(", ")}` });
        }
        if (config && file.size > config.maxSize) {
          logUpload(req, file, "blocked", `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(400).json({ error: `File too large. Maximum size is ${config.maxSize / 1024 / 1024}MB.` });
        }
        logUpload(req, file, "uploaded", null);
      }
    }
  }
  next();
};

router.post("/", authenticate, requireActive, upload.fields([
  { name: "idPhoto", maxCount: 1 },
  { name: "selfiePhoto", maxCount: 1 },
]), verifyVerificationUploads, verificationController.submitVerification);
router.get("/me", authenticate, requireActive, verificationController.getVerificationStatus);
router.post("/mark-viewed", authenticate, authorize("admin"), verificationController.markVerificationViewed);
router.get("/:id", authenticate, authorize("admin"), verificationController.getVerificationById);
router.get("/admin/all", authenticate, authorize("admin"), verificationController.getAllVerifications);
router.post("/:id/approve", authenticate, authorize("admin"), verificationController.approveVerification);
router.post("/:id/reject", authenticate, authorize("admin"), verificationController.rejectVerification);

module.exports = router;
