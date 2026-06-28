const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const profileController = require("../controllers/profileController");
const { authenticate } = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = `${req.user?.userId || "anon"}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
});

router.post("/", authenticate, profileController.createOrUpdateProfile);
router.get("/me", authenticate, profileController.getProfile);
router.get("/:id", profileController.getProfileById);
router.post("/step", authenticate, profileController.updateProfileStep);
router.post("/photo", authenticate, upload.single("photo"), profileController.uploadPhoto);
router.delete("/photo", authenticate, profileController.deletePhoto);
router.post("/complete", authenticate, profileController.setProfileComplete);

module.exports = router;
