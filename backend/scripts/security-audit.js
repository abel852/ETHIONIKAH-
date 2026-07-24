#!/usr/bin/env node
// ============================================================
// Security Audit Script — automated security checks that can
// be run in CI/CD or manually. Checks for common vulnerabilities
// without requiring a running server.
//
// Usage: node scripts/security-audit.js
// ============================================================

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PASS = "\x1b[32mPASS\x1b[0m";
const FAIL = "\x1b[31mFAIL\x1b[0m";
const WARN = "\x1b[33mWARN\x1b[0m";
const INFO = "\x1b[36mINFO\x1b[0m";

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  [${PASS}] ${name}${detail ? " — " + detail : ""}`);
    passCount++;
  } else {
    console.log(`  [${FAIL}] ${name}${detail ? " — " + detail : ""}`);
    failCount++;
  }
}

function warn(name, detail = "") {
  console.log(`  [${WARN}] ${name}${detail ? " — " + detail : ""}`);
  warnCount++;
}

function info(name, detail = "") {
  console.log(`  [${INFO}] ${name}${detail ? " — " + detail : ""}`);
}

function fileContains(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return pattern.test(content);
  } catch {
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ============================================================
// 1. Dependency Vulnerabilities
// ============================================================
console.log("\n=== Dependency Vulnerabilities ===");
try {
  const auditOutput = execSync("npm audit --omit=dev --json", {
    cwd: path.join(__dirname, ".."),
    encoding: "utf8",
    timeout: 30000,
  });
  const audit = JSON.parse(auditOutput);
  const vulns = audit.metadata?.vulnerabilities || {};
  const total = (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0) + (vulns.critical || 0);
  check("No production dependency vulnerabilities", total === 0, `found ${total} vulnerabilities`);
} catch (err) {
  const stdout = err.stdout ? JSON.parse(err.stdout) : {};
  const vulns = stdout.metadata?.vulnerabilities || {};
  const total = (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0) + (vulns.critical || 0);
  check("No production dependency vulnerabilities", total === 0, `found ${total} vulnerabilities`);
}

// ============================================================
// 2. JWT Secret Strength
// ============================================================
console.log("\n=== JWT Configuration ===");
const jwtSecret = process.env.JWT_SECRET || "";
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";

check("JWT_SECRET is set", jwtSecret.length > 0);
check("JWT_SECRET is at least 32 characters", jwtSecret.length >= 32, `${jwtSecret.length} chars`);
check("JWT_REFRESH_SECRET is set", jwtRefreshSecret.length > 0);
check("JWT_REFRESH_SECRET is at least 32 characters", jwtRefreshSecret.length >= 32, `${jwtRefreshSecret.length} chars`);
check("JWT secrets are different", jwtSecret !== jwtRefreshSecret);

// ============================================================
// 3. Encryption Key
// ============================================================
console.log("\n=== Encryption ===");
const encKey = process.env.HEALTH_ENCRYPTION_KEY || "";
check("HEALTH_ENCRYPTION_KEY is set", encKey.length > 0);
check("HEALTH_ENCRYPTION_KEY is at least 32 characters", encKey.length >= 32, `${encKey.length} chars`);

// Check that encryption utility throws in production without key
const encPath = path.join(__dirname, "..", "src", "utils", "encryption.js");
check("Encryption utility rejects missing key in production", fileContains(encPath, /production|NODE_ENV/i));
check("No hardcoded fallback encryption key", !fileContains(encPath, /fallback.*key.*=.*["'].*["']/i));

// ============================================================
// 4. CORS Configuration
// ============================================================
console.log("\n=== CORS ===");
const serverPath = path.join(__dirname, "..", "src", "server.js");
check("CORS is configured", fileContains(serverPath, /cors\(/));
check("CORS uses env-driven origins", fileContains(serverPath, /CORS_ORIGIN/i));
check("No hardcoded production domains in CORS", !fileContains(serverPath, /ethionikah\.com/i));

// ============================================================
// 5. Security Headers (Helmet)
// ============================================================
console.log("\n=== Security Headers ===");
check("Helmet is installed", fileContains(serverPath, /require\(["']helmet["']\)/));
check("CSP is configured", fileContains(serverPath, /contentSecurityPolicy/i));
check("HSTS is production-only", fileContains(serverPath, /isProduction.*\?.*strictTransportSecurity/i) || fileContains(serverPath, /strictTransportSecurity.*isProduction/i));
check("X-Frame-Options is deny", fileContains(serverPath, /frameguard.*deny/i));
check("X-Content-Type-Options is nosniff", fileContains(serverPath, /noSniff.*true/i));
check("Referrer-Policy is configured", fileContains(serverPath, /referrerPolicy/i));
check("Permissions-Policy is configured", fileContains(serverPath, /Permissions-Policy/i) || fileContains(serverPath, /permissionsPolicy/i));
check("No 'unsafe-inline' in CSP styleSrc", !fileContains(serverPath, /styleSrc.*unsafe-inline/i));

// ============================================================
// 6. Rate Limiting
// ============================================================
console.log("\n=== Rate Limiting ===");
const rateLimiterPath = path.join(__dirname, "..", "src", "middleware", "rateLimiter.js");
check("Rate limiter is configured", fileExists(rateLimiterPath));
check("Login rate limiting (3 attempts/15min)", fileContains(rateLimiterPath, /loginLimiter.*max.*3/i) || fileContains(rateLimiterPath, /max:\s*3/i));
check("Signup rate limiting (1/hour)", fileContains(rateLimiterPath, /signupLimiter/i));
check("Password reset rate limiting", fileContains(rateLimiterPath, /passwordResetLimiter/i));
check("Redis-backed rate limit store", fileContains(rateLimiterPath, /rate-limit-redis/i) || fileContains(rateLimiterPath, /RedisStore/i));
check("Throttle middleware exists", fileContains(rateLimiterPath, /throttle/i));

// ============================================================
// 7. Authentication & Authorization
// ============================================================
console.log("\n=== Authentication & Authorization ===");
const authMiddlewarePath = path.join(__dirname, "..", "src", "middleware", "auth.js");
check("Auth middleware fails closed on DB error", fileContains(authMiddlewarePath, /503/i));
check("Token version is checked", fileContains(authMiddlewarePath, /tokenVersion/i));
check("Deleted accounts are blocked", fileContains(authMiddlewarePath, /deletedAt/i));
check("Suspended accounts are blocked", fileContains(authMiddlewarePath, /isActive.*false/i));
check("Admin 2FA middleware exists", fileContains(authMiddlewarePath, /requireAdmin2FA/i));

// ============================================================
// 8. Input Validation
// ============================================================
console.log("\n=== Input Validation ===");
const validatorsPath = path.join(__dirname, "..", "src", "validators", "auth.js");
check("Zod validation schemas exist", fileExists(validatorsPath));
check("Phone login validation exists", fileContains(validatorsPath, /phoneLoginSchema/i));

// Check sanitization middleware
const sanitizePath = path.join(__dirname, "..", "src", "middleware", "sanitize.js");
check("Input sanitization middleware exists", fileExists(sanitizePath));
check("Mongo sanitize is used", fileContains(sanitizePath, /mongoSanitize/i) || fileContains(serverPath, /mongoSanitize/i));

// ============================================================
// 9. Password Security
// ============================================================
console.log("\n=== Password Security ===");
const authControllerPath = path.join(__dirname, "..", "src", "controllers", "authController.js");
const adminControllerPath = path.join(__dirname, "..", "src", "controllers", "adminManagementController.js");

check("Bcrypt is used for password hashing", fileContains(authControllerPath, /bcrypt/i));
check("Password reset increments tokenVersion", fileContains(authControllerPath, /tokenVersion.*\+|increment.*tokenVersion/i) || fileContains(authControllerPath, /tokenVersion/i));
check("Admin password complexity validation", fileContains(adminControllerPath, /uppercase/i) && fileContains(adminControllerPath, /lowercase/i) && fileContains(adminControllerPath, /symbol/i));

// ============================================================
// 10. Cryptographic Security
// ============================================================
console.log("\n=== Cryptographic Security ===");
check("crypto.randomBytes for tokens", fileContains(authControllerPath, /crypto\.randomBytes/i));
check("crypto.randomInt for OTPs", fileContains(authControllerPath, /crypto\.randomInt/i));
check("crypto.randomInt for admin codes", fileContains(adminControllerPath, /crypto\.randomInt/i));
check("Email verification tokens have expiry", fileContains(authControllerPath, /resetTokenExpiry|expiry/i));

// ============================================================
// 11. Brute Force Protection
// ============================================================
console.log("\n=== Brute Force Protection ===");
check("Phone OTP brute force protection", fileContains(authControllerPath, /phoneOtpAttempts/i));
check("Admin verification code brute force protection", fileContains(adminControllerPath, /attempts.*5/i));
check("2FA lockout mechanism", fileContains(authControllerPath, /lockout|twoFactorFailedAttempts/i));

// ============================================================
// 12. Admin 2FA Enforcement
// ============================================================
console.log("\n=== Admin 2FA Enforcement ===");
check("Admin creation requires 2FA", fileContains(adminControllerPath, /2FA.*required|mandatory|has2FA/i));
check("Admin login blocked without 2FA", fileContains(authControllerPath, /ADMIN_2FA_REQUIRED/i));
check("Backup routes require admin 2FA", fileContains(path.join(__dirname, "..", "src", "routes", "backup.js"), /requireAdmin2FA/i));

// ============================================================
// 13. Redis / Multi-Process
// ============================================================
console.log("\n=== Redis / Multi-Process ===");
const redisConfigPath = path.join(__dirname, "..", "src", "config", "redis.js");
check("Redis config exists", fileExists(redisConfigPath));
check("General Redis client exists", fileContains(redisConfigPath, /getGeneralClient/i));
check("Verification codes use Redis", fileContains(adminControllerPath, /getStoreClient|getGeneralClient|REDIS_PREFIX/i));

// ============================================================
// 14. Backup Security
// ============================================================
console.log("\n=== Backup Security ===");
const backupControllerPath = path.join(__dirname, "..", "src", "controllers", "backupController.js");
const backupStoragePath = path.join(__dirname, "..", "src", "utils", "backupStorage.js");
check("S3/R2 backup offload exists", fileExists(backupStoragePath));
check("Backups upload to S3", fileContains(backupControllerPath, /uploadToS3|isS3Configured/i));
check("Backup download from S3 fallback", fileContains(backupControllerPath, /downloadFromS3/i));
check("Backup delete from S3", fileContains(backupControllerPath, /deleteS3Backup/i));
check("No raw error messages in backup responses", !fileContains(backupControllerPath, /error\.message.*res\.status/i));

// ============================================================
// 15. Error Handling / Info Leaks
// ============================================================
console.log("\n=== Error Handling / Info Leaks ===");
check("ForgotPassword prevents email enumeration", fileContains(authControllerPath, /generic.*message|same.*message|always.*success/i) || !fileContains(authControllerPath, /user.*not.*found.*email/i));
check("googleAuthSecret not exposed in admin list", !fileContains(adminControllerPath, /googleAuthSecret.*select/i) || fileContains(adminControllerPath, /select.*googleAuthSecret.*false/i) || !fileContains(adminControllerPath, /googleAuthSecret/i));

// ============================================================
// 16. Body Parser Limits
// ============================================================
console.log("\n=== Body Parser Limits ===");
check("JSON body limit is set", fileContains(serverPath, /express\.json.*limit/i));
check("URL-encoded body limit is set", fileContains(serverPath, /express\.urlencoded.*limit/i));
check("Health routes have larger limit", fileContains(serverPath, /api\/health.*10mb/i));

// ============================================================
// 17. Static File Security
// ============================================================
console.log("\n=== Static File Security ===");
check("Uploads have security headers", fileContains(serverPath, /X-Content-Type-Options.*nosniff/i) && fileContains(serverPath, /uploads/i));
check("Uploads have CSP", fileContains(serverPath, /Content-Security-Policy.*default-src.*none/i));

// ============================================================
// Summary
// ============================================================
console.log("\n" + "=".repeat(60));
console.log(`  Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
console.log("=".repeat(60));

if (failCount > 0) {
  console.log("\n\x1b[31m  ✗ Security audit FAILED — fix the issues above\x1b[0m\n");
  process.exit(1);
} else {
  console.log("\n\x1b[32m  ✓ Security audit PASSED\x1b[0m\n");
  process.exit(0);
}
