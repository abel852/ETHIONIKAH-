const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const profileController = require("../controllers/profileController");
const { authenticate, requireActive } = require("../middleware/auth");
const { profileUpdateLimiter, photoUploadLimiter, profileViewLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../validators/auth");
const { updateProfileSchema, updateProfileStepSchema } = require("../validators/profile");
const { verifyUpload } = require("../middleware/uploadSecurity");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = `${req.user?.userId || "anon"}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || (5 * 1024 * 1024).toString(), 10) },
});

router.get("/badge-counts", authenticate, profileViewLimiter, profileController.getUserBadgeCounts);
router.get("/ban-info", authenticate, profileViewLimiter, profileController.getUserBanInfo);
router.get("/weather", authenticate, profileController.getWeather);
router.post("/", authenticate, requireActive, profileUpdateLimiter, validate(updateProfileSchema), profileController.createOrUpdateProfile);
router.get("/me", authenticate, requireActive, profileViewLimiter, profileController.getProfile);
router.post("/step", authenticate, requireActive, profileUpdateLimiter, validate(updateProfileStepSchema), profileController.updateProfileStep);
router.post("/photo", authenticate, requireActive, photoUploadLimiter, upload.single("photo"), verifyUpload("photo"), profileController.uploadPhoto);
router.delete("/photo", authenticate, requireActive, profileController.deletePhoto);
router.post("/complete", authenticate, requireActive, profileController.setProfileComplete);
router.get("/user/:userId", authenticate, requireActive, profileViewLimiter, profileController.getProfileByUserId);
router.get("/:id", authenticate, requireActive, profileViewLimiter, profileController.getProfileById);

module.exports = router;
