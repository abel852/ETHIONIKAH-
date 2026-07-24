const xss = require("xss");
const mongoSanitize = require("express-mongo-sanitize");

// SQL injection patterns to detect and strip
const SQL_PATTERNS = [
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\b\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/gi,
  /(UNION\s+(ALL\s+)?SELECT)/gi,
  /(INSERT\s+INTO)/gi,
  /(DELETE\s+FROM)/gi,
  /(DROP\s+(TABLE|DATABASE))/gi,
  /(UPDATE\s+\w+\s+SET)/gi,
  /(--\s)/g,
  /(\/\*.*?\*\/)/g,
  /(;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)\b)/gi,
  /(\bEXEC\b\s*\()/gi,
  /(\bWAITFOR\b\s+DELAY\b)/gi,
  /(\bBENCHMARK\b\s*\()/gi,
  /(\bSLEEP\b\s*\()/gi,
];

// Control characters that should never be in user input
const CONTROL_CHARS = /[\x00-\x1F\x7F]/g;

// Maximum string length for any single field
const MAX_STRING_LENGTH = 10000;

/**
 * HTML-escape user input to prevent XSS.
 * Strips ALL HTML tags, script bodies, and dangerous characters.
 * Also strips SQL injection patterns and control characters.
 */
const sanitizeString = (val) => {
  if (typeof val !== "string") return val;

  let cleaned = val;

  // Strip control characters
  cleaned = cleaned.replace(CONTROL_CHARS, "");

  // Strip SQL injection patterns
  for (const pattern of SQL_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Strip ALL HTML tags and script bodies
  cleaned = xss(cleaned, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  });

  // Enforce max length
  if (cleaned.length > MAX_STRING_LENGTH) {
    cleaned = cleaned.substring(0, MAX_STRING_LENGTH);
  }

  return cleaned.trim();
};

/**
 * Recursively sanitize an object's string fields.
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevent deep nesting attacks
  if (depth > 10) return null;
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return sanitizeString(obj);
  if (typeof obj === "number") {
    // Prevent NaN/Infinity
    if (!isFinite(obj)) return 0;
    return obj;
  }
  if (Array.isArray(obj)) {
    // Limit array size
    if (obj.length > 1000) obj = obj.slice(0, 1000);
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }
  if (typeof obj === "object") {
    const cleaned = {};
    for (const [key, val] of Object.entries(obj)) {
      // Skip keys that start with $ or contain . (NoSQL injection)
      if (key.startsWith("$") || key.includes(".")) continue;
      // Skip keys that are too long (potential buffer overflow)
      if (key.length > 100) continue;
      // Skip __proto__ and constructor (prototype pollution)
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      cleaned[key] = sanitizeObject(val, depth + 1);
    }
    return cleaned;
  }
  return obj;
};

/**
 * Express middleware — sanitizes req.body, req.query, req.params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * Express middleware — blocks NoSQL injection operators ($, .)
 */
const mongoSanitizeMiddleware = mongoSanitize({ replaceWith: "_" });

module.exports = { sanitizeInput, sanitizeObject, sanitizeString, mongoSanitizeMiddleware };
