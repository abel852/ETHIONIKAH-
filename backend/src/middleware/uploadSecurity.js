const fs = require("fs");
const path = require("path");
const { logUpload } = require("../utils/uploadLogger");

// ============================================================
// ALLOWED FILE TYPES — strict whitelist
// Maps field name → allowed extensions + MIME types + max size
// Max sizes are env-configurable for production scalability
// ============================================================
const ENV_MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || (5 * 1024 * 1024).toString(), 10);

const FIELD_CONFIG = {
  profilePhoto: { exts: [".jpg", ".jpeg", ".png"], maxSize: Math.min(ENV_MAX_FILE_SIZE, 3 * 1024 * 1024) },
  photo: { exts: [".jpg", ".jpeg", ".png"], maxSize: Math.min(ENV_MAX_FILE_SIZE, 3 * 1024 * 1024) },
  idPhoto: { exts: [".jpg", ".jpeg", ".png"], maxSize: Math.min(ENV_MAX_FILE_SIZE, 3 * 1024 * 1024) },
  selfiePhoto: { exts: [".jpg", ".jpeg", ".png"], maxSize: Math.min(ENV_MAX_FILE_SIZE, 3 * 1024 * 1024) },
  chatImage: { exts: [".jpg", ".jpeg", ".png"], maxSize: ENV_MAX_FILE_SIZE },
  chatFile: {
    exts: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"],
    maxSize: Math.min(ENV_MAX_FILE_SIZE * 2, 10 * 1024 * 1024),
  },
};

// Blocked extensions — always rejected, no exceptions
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".js", ".mjs", ".jar", ".com", ".scr",
  ".msi", ".dll", ".vbs", ".ps1", ".php", ".phtml", ".asp", ".aspx",
  ".jsp", ".py", ".rb", ".pl", ".cgi", ".htaccess", ".htpasswd",
  ".sql", ".db", ".sqlite", ".env", ".config",
  ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz",
  ".webp", ".gif", ".svg", ".bmp", ".tiff", ".ico",
  ".ppt", ".pptx",
  ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm",
  ".mp3", ".wav", ".flac", ".aac", ".ogg",
  ".html", ".htm", ".xml", ".json", ".yaml", ".yml",
  ".bin", ".dat", ".iso", ".img", ".dmg", ".deb", ".rpm", ".apk",
  ".lnk", ".url", ".torrent",
];

// Magic numbers (file signatures) for real content type verification
const MAGIC_NUMBERS = {
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".jpeg": [[0xff, 0xd8, 0xff]],
  ".png": [[0x89, 0x50, 0x4e, 0x47]],
  ".webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  ".gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
  ".pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  ".zip": [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]],
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0]], // OLE2 compound document
  ".docx": [[0x50, 0x4b, 0x03, 0x04]], // ZIP-based (same as zip)
  ".xls": [[0xd0, 0xcf, 0x11, 0xe0]],
  ".xlsx": [[0x50, 0x4b, 0x03, 0x04]],
  ".ppt": [[0xd0, 0xcf, 0x11, 0xe0]],
  ".pptx": [[0x50, 0x4b, 0x03, 0x04]],
  ".txt": [], // no magic number, skip
  ".csv": [], // no magic number, skip
};

/**
 * Verify file's magic number matches its extension.
 * Reads first 8 bytes and compares against known signatures.
 */
function verifyMagicNumber(filePath, ext) {
  const signatures = MAGIC_NUMBERS[ext];
  if (!signatures || signatures.length === 0) return true; // no signature to check

  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(8);
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);

    return signatures.some(sig => {
      for (let i = 0; i < sig.length; i++) {
        if (buf[i] !== sig[i]) return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}

/**
 * Middleware factory — creates an upload security checker for a given field.
 * Run AFTER multer has saved the file to disk.
 *
 * Checks:
 * 1. Extension not in blocked list
 * 2. Extension allowed for this field
 * 3. File size within limit
 * 4. Magic number matches extension (real content type)
 *
 * If any check fails, the file is deleted and the request is rejected.
 */
const verifyUpload = (fieldName) => (req, res, next) => {
  const file = req.file;
  if (!file) return next();

  const config = FIELD_CONFIG[fieldName];
  const ext = path.extname(file.originalname).toLowerCase();
  const ip = req.ip || "unknown";

  // 1. Check blocked extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    logUpload(req, file, "blocked", `Blocked extension: ${ext}`);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(400).json({ error: "This file type is not allowed for security reasons." });
  }

  // 2. Check allowed extensions for this field
  if (config && !config.exts.includes(ext)) {
    logUpload(req, file, "blocked", `Extension ${ext} not allowed for field ${fieldName}`);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(400).json({ error: `File type ${ext} is not allowed. Allowed: ${config.exts.join(", ")}` });
  }

  // 3. Check file size
  if (config && file.size > config.maxSize) {
    logUpload(req, file, "blocked", `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${config.maxSize / 1024 / 1024}MB)`);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(400).json({ error: `File too large. Maximum size is ${config.maxSize / 1024 / 1024}MB.` });
  }

  // 4. Verify magic number (real content type)
  if (!verifyMagicNumber(file.path, ext)) {
    logUpload(req, file, "blocked", `Magic number mismatch: file claims to be ${ext} but content doesn't match`);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(400).json({ error: "File content doesn't match its extension. The file may be disguised." });
  }

  // All checks passed — log successful upload
  logUpload(req, file, "uploaded", null);
  next();
};

/**
 * Middleware factory for multiple file uploads (array).
 */
const verifyUploadArray = (fieldName) => (req, res, next) => {
  const files = req.files;
  if (!files || files.length === 0) return next();

  for (const file of files) {
    const config = FIELD_CONFIG[fieldName];
    const ext = path.extname(file.originalname).toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      logUpload(req, file, "blocked", `Blocked extension: ${ext}`);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "This file type is not allowed for security reasons." });
    }

    if (config && !config.exts.includes(ext)) {
      logUpload(req, file, "blocked", `Extension ${ext} not allowed for field ${fieldName}`);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: `File type ${ext} is not allowed.` });
    }

    if (config && file.size > config.maxSize) {
      logUpload(req, file, "blocked", `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: `File too large. Maximum size is ${config.maxSize / 1024 / 1024}MB.` });
    }

    if (!verifyMagicNumber(file.path, ext)) {
      logUpload(req, file, "blocked", `Magic number mismatch for ${ext}`);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "File content doesn't match its extension." });
    }

    logUpload(req, file, "uploaded", null);
  }

  next();
};

module.exports = { verifyUpload, verifyUploadArray, FIELD_CONFIG, BLOCKED_EXTENSIONS };
