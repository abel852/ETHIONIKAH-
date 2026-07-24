const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Production-configurable upload limits (2 vCPU / 4 GB VPS defaults)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || (5 * 1024 * 1024).toString(), 10); // 5 MB
const MAX_FILES_PER_UPLOAD = parseInt(process.env.MAX_FILES_PER_UPLOAD || "5", 10);

const uploadDirs = ["uploads/profile-photos", "uploads/national-ids", "uploads/selfies", "uploads/chat-images", "uploads/chat-files"];
uploadDirs.forEach((dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";
    if (file.fieldname === "profilePhoto" || file.fieldname === "photo") folder += "/profile-photos";
    else if (file.fieldname === "idPhoto") folder += "/national-ids";
    else if (file.fieldname === "selfiePhoto") folder += "/selfies";
    else if (file.fieldname === "chatImage") folder += "/chat-images";
    else if (file.fieldname === "chatFile") folder += "/chat-files";

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Always generate random filename — never keep original
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "");
    cb(null, `${uuidv4()}${safeExt}`);
  },
});

// Basic fileFilter — quick first pass (uploadSecurity middleware does deep verification after save)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const blocked = [".exe", ".bat", ".cmd", ".sh", ".js", ".mjs", ".jar", ".com", ".scr",
    ".msi", ".dll", ".vbs", ".ps1", ".php", ".phtml", ".asp", ".aspx",
    ".jsp", ".py", ".rb", ".pl", ".cgi", ".htaccess", ".htpasswd",
    ".sql", ".db", ".sqlite", ".env", ".config"];

  if (blocked.includes(ext)) {
    cb(new Error("This file type is not allowed for security reasons."), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD,
  },
});

module.exports = upload;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports.MAX_FILES_PER_UPLOAD = MAX_FILES_PER_UPLOAD;
