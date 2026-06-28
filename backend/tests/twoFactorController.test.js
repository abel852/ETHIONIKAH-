const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("speakeasy", () => ({
  generateSecret: jest.fn(() => ({
    base32: "MOCKBASE32SECRET",
    otpauth_url: "otpauth://totp/Ethio%20Nikah",
  })),
  totp: {
    verify: jest.fn(() => true),
  },
  otpauthURL: jest.fn(() => "otpauth://totp/test"),
}));

jest.mock("qrcode", () => ({
  toDataURL: jest.fn(() => Promise.resolve("data:image/png;base64,mockedqrcode")),
}));

jest.mock("../src/config/database", () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("../src/utils/email", () => ({
  sendEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock("../src/utils/auditLogger", () => ({
  logAudit: jest.fn(() => Promise.resolve()),
}));

const prisma = require("../src/config/database");
const speakeasy = require("speakeasy");
let app;

beforeAll(() => {
  const server = require("../src/server");
  app = server.app;
});

beforeEach(() => {
  jest.clearAllMocks();
  speakeasy.totp.verify.mockReturnValue(true);
  speakeasy.generateSecret.mockReturnValue({
    base32: "MOCKBASE32SECRET",
    otpauth_url: "otpauth://totp/Ethio%20Nikah",
  });
});

function authedUser(tokenOverrides) {
  return jwt.sign({ userId: "uuid-123", role: "user", ...tokenOverrides }, process.env.JWT_SECRET);
}

function authedAdmin(tokenOverrides) {
  return jwt.sign({ userId: "admin-456", role: "admin", ...tokenOverrides }, process.env.JWT_SECRET);
}

function tempToken(overrides) {
  return jwt.sign({ userId: "uuid-123", purpose: "2fa", ...overrides }, process.env.JWT_SECRET, { expiresIn: "5m" });
}

const baseUser = {
  id: "uuid-123",
  email: "test@example.com",
  phone: "+251911000000",
  firstName: "John",
  lastName: "Doe",
  passwordHash: null,
  role: "user",
  isActive: true,
  isVerified: false,
  isEmailVerified: false,
  isPhoneVerified: false,
  twoFactorEnabled: true,
  twoFactorPermanentlyLocked: false,
  twoFactorLockedUntil: null,
  twoFactorFailedAttempts: 0,
  googleAuthSecret: "MOCKBASE32SECRET",
  backupCodes: null,
  usedBackupCodes: null,
  tokenVersion: 1,
  lastLoginAt: null,
  createdAt: new Date(),
  profile: null,
  verification: null,
};

describe("POST /api/auth/2fa/verify", () => {
  it("verifies 2FA and completes login with valid TOTP code", async () => {
    speakeasy.totp.verify.mockReturnValue(true);
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("returns 400 without temp token or code", async () => {
    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Temp token and code are required");
  });

  it("returns 400 with expired temp token", async () => {
    const expiredToken = jwt.sign(
      { userId: "uuid-123", purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "0s" }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: expiredToken, token: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Session expired. Please login again.");
  });

  it("returns 400 with invalid temp token purpose", async () => {
    const badPurposeToken = jwt.sign(
      { userId: "uuid-123", purpose: "login" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: badPurposeToken, token: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid token purpose");
  });

  it("returns 401 when user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  });

  it("returns 400 when 2FA is not enabled", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, twoFactorEnabled: false });

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("2FA is not enabled for this account");
  });

  it("returns 403 when account is permanently locked", async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, twoFactorPermanentlyLocked: true });

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account locked. Contact admin via Help & Support.");
  });

  it("returns 403 when account is temporarily locked", async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      twoFactorLockedUntil: new Date(Date.now() + 3600000),
    });

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account temporarily locked. Try again later.");
  });

  it("returns 400 with invalid code and tracks failed attempts", async () => {
    speakeasy.totp.verify.mockReturnValue(false);
    prisma.user.findUnique.mockResolvedValue(baseUser);
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid code");
    expect(res.body.attemptsRemaining).toBeDefined();
  });

  it("returns 403 after too many failed attempts locks account", async () => {
    speakeasy.totp.verify.mockReturnValue(false);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, twoFactorFailedAttempts: 3 });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "000000" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Too many failed attempts. Account locked for 6 hours.");
  });

  it("accepts valid backup code", async () => {
    speakeasy.totp.verify.mockReturnValue(false);
    const hashedCode = bcrypt.hashSync("ABCD-1234-EFGH-5678", 6);
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      backupCodes: JSON.stringify([hashedCode]),
      usedBackupCodes: JSON.stringify([]),
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "ABCD-1234-EFGH-5678" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
  });

  it("returns 400 with already used backup code", async () => {
    speakeasy.totp.verify.mockReturnValue(false);
    const hashedCode = bcrypt.hashSync("ABCD-1234-EFGH-5678", 6);
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      backupCodes: JSON.stringify([]),
      usedBackupCodes: JSON.stringify([hashedCode]),
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "ABCD-1234-EFGH-5678" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("This recovery code has already been used");
  });

  it("returns 500 on database error", async () => {
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/verify")
      .send({ tempToken: tempToken(), token: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("2FA verification failed");
  });
});

describe("GET /api/auth/2fa/status", () => {
  it("returns 2FA status when enabled", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      twoFactorEnabled: true,
      googleAuthSecret: "MOCKBASE32SECRET",
      backupCodes: JSON.stringify(["code1", "code2"]),
    });

    const res = await request(app)
      .get("/api/auth/2fa/status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.hasSecret).toBe(true);
    expect(res.body.backupCodeCount).toBe(2);
  });

  it("returns 2FA status when disabled", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      twoFactorEnabled: false,
      googleAuthSecret: null,
      backupCodes: null,
    });

    const res = await request(app)
      .get("/api/auth/2fa/status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
    expect(res.body.hasSecret).toBe(false);
    expect(res.body.backupCodeCount).toBe(0);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/auth/2fa/status");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/auth/2fa/status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to get 2FA status");
  });
});

describe("POST /api/auth/2fa/enable", () => {
  it("generates new 2FA secret for new setup", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      googleAuthSecret: null,
      passwordHash: null,
    });

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.secret).toBeDefined();
    expect(res.body.qrCode).toBeDefined();
    expect(res.body.existing).toBe(false);
  });

  it("returns existing secret if already set up without force", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      googleAuthSecret: "EXISTINGSECRET",
      passwordHash: null,
    });

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.secret).toBe("EXISTINGSECRET");
    expect(res.body.existing).toBe(true);
  });

  it("forces new secret with valid password", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      googleAuthSecret: "EXISTINGSECRET",
      passwordHash,
    });

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ force: true, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.existing).toBe(false);
  });

  it("returns 400 when force is set without password", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      googleAuthSecret: "EXISTINGSECRET",
      passwordHash: await bcrypt.hash("password123", 10),
    });

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ force: true });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password is required to generate a new key");
  });

  it("returns 401 when force is set with wrong password", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("correctpassword", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      googleAuthSecret: "EXISTINGSECRET",
      passwordHash,
    });

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`)
      .send({ force: true, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid password");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/auth/2fa/enable");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/enable")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to generate 2FA setup");
  });
});

describe("POST /api/auth/2fa/confirm", () => {
  it("confirms 2FA setup with valid code", async () => {
    const token = authedUser();
    speakeasy.totp.verify.mockReturnValue(true);
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({ email: "test@example.com", firstName: "John" });

    const res = await request(app)
      .post("/api/auth/2fa/confirm")
      .set("Authorization", `Bearer ${token}`)
      .send({ secret: "MOCKBASE32SECRET", token: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Two-factor authentication enabled");
    expect(res.body.backupCodes).toBeDefined();
    expect(res.body.backupCodes.length).toBe(10);
  });

  it("returns 400 when secret or token is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/auth/2fa/confirm")
      .set("Authorization", `Bearer ${token}`)
      .send({ secret: "MOCKBASE32SECRET" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Secret and token are required");
  });

  it("returns 400 when code is invalid", async () => {
    const token = authedUser();
    speakeasy.totp.verify.mockReturnValue(false);

    const res = await request(app)
      .post("/api/auth/2fa/confirm")
      .set("Authorization", `Bearer ${token}`)
      .send({ secret: "MOCKBASE32SECRET", token: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid code. Try again.");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/auth/2fa/confirm")
      .send({ secret: "MOCKBASE32SECRET", token: "123456" });

    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    speakeasy.totp.verify.mockReturnValue(true);
    prisma.user.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/confirm")
      .set("Authorization", `Bearer ${token}`)
      .send({ secret: "MOCKBASE32SECRET", token: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to enable 2FA");
  });
});

describe("POST /api/auth/2fa/disable", () => {
  it("disables 2FA with valid password and TOTP code", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
      backupCodes: JSON.stringify(["hashedcode1"]),
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "password123", token: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Two-factor authentication disabled");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: expect.objectContaining({
          twoFactorEnabled: false,
          tokenVersion: { increment: 1 },
        }),
      })
    );
  });

  it("returns 400 without password or token", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password and authenticator code are required");
  });

  it("returns 401 with wrong password", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("correctpassword", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "wrongpassword", token: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid password");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .send({ password: "password123", token: "123456" });

    expect(res.status).toBe(401);
  });

  it("disables 2FA using backup code", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    const hashedBackup = bcrypt.hashSync("BACK-1234-CODE-5678", 6);
    speakeasy.totp.verify.mockReturnValue(false);
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
      googleAuthSecret: "MOCKBASE32SECRET",
      backupCodes: JSON.stringify([hashedBackup]),
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "password123", token: "BACK-1234-CODE-5678" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Two-factor authentication disabled");
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    prisma.user.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "password123", token: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to disable 2FA");
  });
});

describe("GET /api/auth/2fa/recovery-codes", () => {
  it("returns recovery codes when they exist", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      backupCodes: JSON.stringify(["hash1", "hash2", "hash3"]),
    });

    const res = await request(app)
      .get("/api/auth/2fa/recovery-codes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.codes).toHaveLength(3);
    expect(res.body.count).toBe(3);
    expect(res.body.codes[0]).toHaveProperty("index");
    expect(res.body.codes[0]).toHaveProperty("used");
    expect(res.body.codes[0]).toHaveProperty("hint");
  });

  it("returns empty array when no backup codes exist", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ backupCodes: null });

    const res = await request(app)
      .get("/api/auth/2fa/recovery-codes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.codes).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/auth/2fa/recovery-codes");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/auth/2fa/recovery-codes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to get recovery codes");
  });
});

describe("POST /api/auth/2fa/regenerate-codes", () => {
  it("regenerates backup codes with valid password", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/regenerate-codes")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.backupCodes).toBeDefined();
    expect(res.body.backupCodes.length).toBe(10);
  });

  it("returns 400 when password is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/auth/2fa/regenerate-codes")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Password is required");
  });

  it("returns 401 with wrong password", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("correctpassword", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    const res = await request(app)
      .post("/api/auth/2fa/regenerate-codes")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid password");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/auth/2fa/regenerate-codes")
      .send({ password: "password123" });

    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    const passwordHash = await bcrypt.hash("password123", 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    prisma.user.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/regenerate-codes")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "password123" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to regenerate backup codes");
  });
});

describe("POST /api/auth/2fa/trust-device", () => {
  it("generates trusted device token", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/auth/2fa/trust-device")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.deviceToken).toBeDefined();
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/auth/2fa/trust-device");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/2fa/lockout-status", () => {
  it("returns not locked when no lockout exists", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      twoFactorPermanentlyLocked: false,
      twoFactorLockedUntil: null,
    });

    const res = await request(app)
      .get("/api/auth/2fa/lockout-status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.locked).toBe(false);
  });

  it("returns permanently locked status", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      twoFactorPermanentlyLocked: true,
      twoFactorLockedUntil: null,
    });

    const res = await request(app)
      .get("/api/auth/2fa/lockout-status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.locked).toBe(true);
    expect(res.body.permanent).toBe(true);
  });

  it("returns temporarily locked status", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      twoFactorPermanentlyLocked: false,
      twoFactorLockedUntil: new Date(Date.now() + 3600000),
    });

    const res = await request(app)
      .get("/api/auth/2fa/lockout-status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.locked).toBe(true);
    expect(res.body.permanent).toBe(false);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/auth/2fa/lockout-status");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/auth/2fa/lockout-status")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to check lockout status");
  });
});

describe("POST /api/auth/2fa/admin-reset/:id", () => {
  it("resets 2FA for user as admin", async () => {
    const token = authedAdmin();
    prisma.user.findUnique.mockResolvedValue({ id: "target-id", email: "target@example.com" });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/2fa/admin-reset/target-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("2FA reset for user");
  });

  it("returns 404 when target user not found", async () => {
    const token = authedAdmin();
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/2fa/admin-reset/nonexistent-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/auth/2fa/admin-reset/some-id");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedAdmin();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/auth/2fa/admin-reset/target-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to reset 2FA");
  });
});
