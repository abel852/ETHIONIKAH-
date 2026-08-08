const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const controller = require("../controllers/marriageSuccessController");
const { authenticate, requireActive, authorize, requireAdmin2FA } = require("../middleware/auth");

// ============================================================
// Multer config for marriage photos
// ============================================================
const photosDir = path.join(__dirname, "..", "..", "uploads", "marriage-photos");
const certsDir = path.join(__dirname, "..", "..", "uploads", "marriage-certificates");
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "marriageCertificate") {
      cb(null, certsDir);
    } else {
      cb(null, photosDir);
    }
  },
  filename: (req, file, cb) => {
    const unique = `${req.user?.userId || "anon"}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mimeOk = file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";
    if (allowed.test(ext) && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed"));
    }
  },
});

// Multi-file upload: weddingPhotos[], engagementPhotos[], ringPhotos[], marriageCertificate (single)
const uploadFields = upload.fields([
  { name: "weddingPhotos", maxCount: 10 },
  { name: "engagementPhotos", maxCount: 10 },
  { name: "ringPhotos", maxCount: 10 },
  { name: "marriageCertificate", maxCount: 1 },
]);

// ============================================================
// User routes
// ============================================================
router.post("/request", authenticate, requireActive, controller.requestMarriageSuccess);

// Post-approval actions (must be before /:submissionId to avoid route shadowing)
router.post("/archive-account", authenticate, requireActive, controller.archiveAccount);
router.post("/delete-account/verify-password", authenticate, requireActive, controller.deleteAccountVerifyPassword);
router.post("/delete-account/confirm", authenticate, requireActive, controller.deleteAccountConfirm);

router.post("/:submissionId/confirm", authenticate, requireActive, controller.confirmMarriageSuccess);
router.post("/:submissionId/upload", authenticate, requireActive, uploadFields, controller.uploadMarriagePhotos);
router.get("/mine", authenticate, requireActive, controller.getMyMarriageSuccess);
router.get("/:submissionId", authenticate, requireActive, controller.getMarriageSuccess);
router.delete("/:submissionId", authenticate, requireActive, controller.cancelMarriageSuccess);

// Public route — published success stories
router.get("/public/stories", controller.getPublishedSuccessStories);

// ============================================================
// Admin routes
// ============================================================
const adminAuth = [authenticate, authorize("admin"), requireAdmin2FA];
router.get("/admin/submissions", ...adminAuth, controller.adminGetSubmissions);
router.get("/admin/submissions/:submissionId", ...adminAuth, controller.adminGetSubmission);
router.post("/admin/submissions/:submissionId/approve", ...adminAuth, controller.adminApproveSubmission);
router.post("/admin/submissions/:submissionId/reject", ...adminAuth, controller.adminRejectSubmission);

module.exports = router;
