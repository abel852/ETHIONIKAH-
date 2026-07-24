const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const paymentController = require("../controllers/paymentController");
const { authenticate, authorize, requireActive } = require("../middleware/auth");

// Dedicated receipt storage — separate from profile photos
const receiptDir = path.join(__dirname, "..", "..", "uploads", "receipts");
if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, receiptDir),
  filename: (req, file, cb) => {
    const unique = `receipt-${req.user?.userId || "anon"}-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    cb(null, unique);
  },
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG, and PDF files are allowed for receipts."), false);
    }
  },
});

// Admin routes
router.get("/admin/payments", authenticate, authorize("admin"), paymentController.getAdminPayments);
router.get("/admin/payments/stats", authenticate, authorize("admin"), paymentController.getPaymentStats);
router.get("/admin/payments/renewals", authenticate, authorize("admin"), paymentController.getRenewalReminders);
router.post("/admin/payments/:id/approve", authenticate, authorize("admin"), paymentController.approvePayment);
router.post("/admin/payments/:id/reject", authenticate, authorize("admin"), paymentController.rejectPayment);
router.get("/admin/verify-transaction/:ref", authenticate, authorize("admin"), paymentController.verifyTransaction);

// User routes
router.post("/", authenticate, requireActive, paymentController.createPaymentRequest);
router.get("/my", authenticate, requireActive, paymentController.getMyPayments);
router.get("/wallet", authenticate, requireActive, paymentController.getMyWallet);
router.post("/receipt", authenticate, requireActive, uploadReceipt.single("receipt"), paymentController.uploadReceiptFile);

module.exports = router;
