const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

let _cachedKey = null;

function getKey() {
  if (_cachedKey) return _cachedKey;

  const secret = process.env.HEALTH_ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("HEALTH_ENCRYPTION_KEY is not set. Refusing to encrypt/decrypt with a default key in production.");
    }
    // Development-only fallback — logged as a warning
    console.warn("[ENCRYPTION] HEALTH_ENCRYPTION_KEY not set — using insecure dev-only fallback. DO NOT use in production.");
  }
  _cachedKey = crypto.createHash("sha256").update(secret || "dev-only-insecure-key-do-not-use-in-prod").digest();
  return _cachedKey;
}

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encrypted) {
  if (!encrypted) return null;
  const parts = encrypted.split(":");
  if (parts.length !== 2) return null;
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
