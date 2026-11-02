const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const backupController = require("../controllers/backupController");
const { authenticate, authorize, requireAdmin2FA } = require("../middleware/auth");
const { requirePermission } = require("../middleware/rbac");

const baseAdmin = [authenticate, authorize("admin"), requireAdmin2FA];

const BACKUP_DIR = path.join(__dirname, "..", "..", "backups");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const backupStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BACKUP_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, safeName);
  },
});

const uploadBackup = multer({
  storage: backupStorage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".sql") || file.originalname.endsWith(".tar.gz")) {
      cb(null, true);
    } else {
      cb(new Error("Only .sql and .tar.gz backup files are allowed"));
    }
  },
});

router.post("/backup/create", ...baseAdmin, requirePermission("backup.create"), backupController.createBackup);
router.post("/backup/create-full", ...baseAdmin, requirePermission("backup.create"), backupController.createFullBackup);
router.post("/backup/auto-trigger", ...baseAdmin, requirePermission("backup.create"), async (req, res) => {
  try {
    const { createAutoBackup } = require("../utils/autoBackup");
    const result = await createAutoBackup();
    if (result.success) {
      res.json({ success: true, filename: result.filename, sizeMB: result.sizeMB, message: "Auto backup completed and email sent (if configured)" });
    } else {
      res.status(500).json({ error: "Auto backup failed", details: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to trigger auto backup" });
  }
});
router.get("/backup/list", ...baseAdmin, requirePermission("backup.view"), backupController.listBackups);
router.get("/backup/download/:filename", ...baseAdmin, requirePermission("backup.view"), backupController.downloadBackup);
router.post("/backup/restore", ...baseAdmin, requirePermission("backup.restore"), backupController.restoreBackup);
router.get("/backup/restore-progress", ...baseAdmin, requirePermission("backup.restore"), backupController.getRestoreProgress);
router.delete("/backup/:filename", ...baseAdmin, requirePermission("backup.delete"), backupController.deleteBackup);
router.post("/backup/upload", ...baseAdmin, requirePermission("backup.create"), uploadBackup.single("backupFile"), backupController.uploadBackup);

module.exports = router;
