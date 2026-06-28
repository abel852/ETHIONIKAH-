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
  profile: {
    create: jest.fn(),
  },
  spousePreference: {
    create: jest.fn(),
  },
}));

const prisma = require("../src/config/database");
let app;
beforeAll(() => {
  const server = require("../src/server");
  app = server.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

function authedUser(tokenOverrides) {
  return jwt.sign({ userId: "uuid-123", role: "user", ...tokenOverrides }, process.env.JWT_SECRET);
}

describe("POST /api/auth/register", () => {
  const validPayload = {
    email: "test@example.com",
    phone: "+251911000000",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    gender: "male",
    dateOfBirth: "1995-06-15",
  };

  it("registers a new user successfully", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "uuid-123",
      email: validPayload.email,
      phone: validPayload.phone,
      firstName: validPayload.firstName,
      lastName: validPayload.lastName,
      gender: validPayload.gender,
      dateOfBirth: new Date(validPayload.dateOfBirth),
      role: "user",
      isVerified: false,
      isEmailVerified: false,
      isPhoneVerified: false,
      tokenVersion: 0,
    });
    prisma.profile.create.mockResolvedValue({ id: "profile-id" });

    const res = await request(app)
      .post("/api/auth/register")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Registration successful");
    expect(res.body.user.email).toBe(validPayload.email);
    expect(res.body.user.firstName).toBe(validPayload.firstName);
    expect(res.body.user.lastName).toBe(validPayload.lastName);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.profile.create).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when email already exists", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "existing-id", email: validPayload.email });

    const res = await request(app)
      .post("/api/auth/register")
      .send(validPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email or phone already registered");
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, email: "not-email" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validPayload, password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  const credentials = { email: "test@example.com", password: "password123" };

  it("logs in successfully with valid credentials", async () => {
    const passwordHash = await bcrypt.hash(credentials.password, 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: credentials.email,
      phone: "+251911000000",
      firstName: "John",
      lastName: "Doe",
      passwordHash,
      role: "user",
      isActive: true,
      isVerified: false,
      isEmailVerified: false,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      lastLoginAt: null,
      createdAt: new Date(),
      profile: null,
      verification: null,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("returns 401 with wrong password", async () => {
    const passwordHash = await bcrypt.hash("correctpassword", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: credentials.email,
      passwordHash,
      isActive: true,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 401 for non-existent user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 403 for suspended account", async () => {
    const passwordHash = await bcrypt.hash(credentials.password, 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: credentials.email,
      passwordHash,
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account is suspended");
  });
});

describe("POST /api/auth/login/phone", () => {
  const credentials = { phone: "+251911000000", password: "password123" };

  it("logs in successfully with valid phone and password", async () => {
    const passwordHash = await bcrypt.hash(credentials.password, 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: "test@example.com",
      phone: credentials.phone,
      firstName: "John",
      lastName: "Doe",
      passwordHash,
      role: "user",
      isActive: true,
      twoFactorEnabled: false,
      isVerified: false,
      isEmailVerified: false,
      isPhoneVerified: false,
      lastLoginAt: null,
      createdAt: new Date(),
      profile: null,
      verification: null,
    });

    const res = await request(app)
      .post("/api/auth/login/phone")
      .send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.user.phone).toBe(credentials.phone);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("returns 401 with invalid phone", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login/phone")
      .send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("returns 403 for suspended account", async () => {
    const passwordHash = await bcrypt.hash(credentials.password, 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: "test@example.com",
      phone: credentials.phone,
      passwordHash,
      isActive: false,
    });

    const res = await request(app)
      .post("/api/auth/login/phone")
      .send(credentials);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Account is suspended");
  });
});

describe("POST /api/auth/refresh", () => {
  it("refreshes tokens successfully", async () => {
    const refreshToken = jwt.sign(
      { userId: "uuid-123" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      role: "user",
      isActive: true,
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("returns 401 for inactive user", async () => {
    const refreshToken = jwt.sign(
      { userId: "uuid-123" },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it("returns 401 with invalid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "invalid-token" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid refresh token");
  });
});

describe("POST /api/auth/logout", () => {
  it("logs out successfully", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully");
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("sends reset token for valid email", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: "test@example.com",
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("If the email exists, a reset link has been sent");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: expect.objectContaining({ resetToken: expect.any(String), resetTokenExpiry: expect.any(Date) }),
      })
    );
  });

  it("returns 404 for unknown email", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@example.com" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No account with that email");
  });
});

describe("POST /api/auth/reset-password", () => {
  it("resets password successfully without 2FA", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "uuid-123",
      twoFactorEnabled: false,
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "valid-token", password: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successfully");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: expect.objectContaining({ passwordHash: expect.any(String), resetToken: null, resetTokenExpiry: null }),
      })
    );
  });

  it("returns 400 for invalid or expired token", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalid-token", password: "newpassword123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("POST /api/auth/verify-email", () => {
  it("verifies email successfully", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "uuid-123",
      email: "test@example.com",
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "valid-token" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified successfully");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: { isEmailVerified: true, resetToken: null },
      })
    );
  });

  it("returns 400 for invalid token", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "invalid-token" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid token");
  });
});

describe("POST /api/auth/verify-phone", () => {
  it("verifies phone successfully with valid OTP", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      phoneOtp: "123456",
      phoneOtpExpiry: new Date(Date.now() + 600000),
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/verify-phone")
      .set("Authorization", `Bearer ${token}`)
      .send({ otp: "123456", userId: "uuid-123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Phone verified successfully");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: { isPhoneVerified: true, phoneOtp: null, phoneOtpExpiry: null },
      })
    );
  });

  it("returns 400 for invalid OTP", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      phoneOtp: "123456",
      phoneOtpExpiry: new Date(Date.now() + 600000),
    });

    const res = await request(app)
      .post("/api/auth/verify-phone")
      .set("Authorization", `Bearer ${token}`)
      .send({ otp: "wrong-otp", userId: "uuid-123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid or expired OTP");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/auth/verify-phone")
      .send({ otp: "123456", userId: "uuid-123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/send-phone-otp", () => {
  it("sends OTP successfully", async () => {
    const token = authedUser();
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/send-phone-otp")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "uuid-123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("OTP sent successfully");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: expect.objectContaining({ phoneOtp: expect.any(String), phoneOtpExpiry: expect.any(Date) }),
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/auth/send-phone-otp")
      .send({ userId: "uuid-123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user", async () => {
    const token = jwt.sign({ userId: "uuid-123", role: "user" }, process.env.JWT_SECRET);
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      email: "test@example.com",
      phone: "+251911000000",
      firstName: "John",
      lastName: "Doe",
      gender: "male",
      dateOfBirth: new Date("1995-06-15"),
      role: "user",
      isVerified: false,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      profile: null,
      verification: null,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe("John");
    expect(res.body.user.lastName).toBe("Doe");
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("2FA Endpoints", () => {
  describe("POST /api/auth/2fa/enable", () => {
    it("generates 2FA secret for new setup", async () => {
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

    it("returns existing secret if already set up", async () => {
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

    it("returns 401 without authentication", async () => {
      const res = await request(app).post("/api/auth/2fa/enable");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/2fa/verify", () => {
    it("verifies 2FA and completes login", async () => {
      const tempToken = jwt.sign(
        { userId: "uuid-123", purpose: "2fa" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      const passwordHash = await bcrypt.hash("password123", 10);
      prisma.user.findUnique.mockResolvedValue({
        id: "uuid-123",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+251911000000",
        passwordHash,
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
        lastLoginAt: null,
        createdAt: new Date(),
        profile: null,
        verification: null,
      });
      prisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/2fa/verify")
        .send({ tempToken, token: "123456" });

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
  });

  describe("POST /api/auth/2fa/disable", () => {
    it("disables 2FA successfully", async () => {
      const token = authedUser();
      const passwordHash = await bcrypt.hash("password123", 10);
      prisma.user.findUnique.mockResolvedValue({
        id: "uuid-123",
        email: "test@example.com",
        firstName: "John",
        passwordHash,
        googleAuthSecret: "MOCKBASE32SECRET",
        twoFactorEnabled: true,
        twoFactorFailedAttempts: 0,
        twoFactorLockedUntil: null,
        twoFactorPermanentlyLocked: false,
        backupCodes: JSON.stringify(["hashedcode1"]),
        tokenVersion: 1,
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

    it("returns 401 without authentication", async () => {
      const res = await request(app)
        .post("/api/auth/2fa/disable")
        .send({ password: "password123", token: "123456" });

      expect(res.status).toBe(401);
    });
  });
});
