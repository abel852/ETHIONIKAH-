const jwt = require("jsonwebtoken");

// Validate that JWT secrets are set — refuse to start without them
function validateSecrets() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set and at least 32 characters in production.");
    }
    console.warn("[AUTH] JWT_SECRET not set or too short — using insecure dev fallback. DO NOT use in production.");
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_REFRESH_SECRET must be set and at least 32 characters in production.");
    }
    console.warn("[AUTH] JWT_REFRESH_SECRET not set or too short — using insecure dev fallback. DO NOT use in production.");
  }
}

validateSecrets();

const ACCESS_SECRET = process.env.JWT_SECRET || "dev-only-insecure-access-secret-32chars";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-only-insecure-refresh-secret-32ch";

const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_SECRET,
  REFRESH_SECRET,
};
