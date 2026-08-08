const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ctrl = require("../controllers/bookController");
const { authenticate, authorize, requireActive, requireAdmin2FA } = require("../middleware/auth");

// Ensure books upload directory exists
const booksDir = path.join(__dirname, "..", "..", "uploads", "books");
if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });

const bookStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, booksDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "");
    cb(null, `book-${Date.now()}-${safeName}`);
  },
});

const uploadBook = multer({
  storage: bookStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".epub", ".txt", ".doc", ".docx"];
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, EPUB, TXT, DOC, DOCX files are allowed"));
  },
});

// Admin routes
const adminAccess = [authenticate, authorize("admin"), requireAdmin2FA];
router.post("/admin/books", ...adminAccess, uploadBook.single("file"), ctrl.createBook);
router.get("/admin/books", ...adminAccess, ctrl.listBooks);
router.put("/admin/books/:id", ...adminAccess, ctrl.updateBook);
router.delete("/admin/books/:id", ...adminAccess, ctrl.deleteBook);

// User routes
router.get("/books", authenticate, requireActive, ctrl.listAvailableBooks);
router.get("/books/my", authenticate, requireActive, ctrl.myBooks);
router.post("/books/:id/purchase", authenticate, requireActive, ctrl.purchaseBook);
router.get("/books/:id/read", authenticate, requireActive, ctrl.readBook);

module.exports = router;
