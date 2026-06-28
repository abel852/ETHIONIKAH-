const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  adminPermission: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock("../src/utils/auditLogger", () => ({
  logAudit: jest.fn(),
}));

jest.mock("otplib", () => ({
  authenticator: {
    generateSecret: jest.fn(() => "MOCK_SECRET"),
    keyuri: jest.fn(() => "otpauth://totp/test?secret=MOCK_SECRET"),
    verify: jest.fn(() => true),
  },
}));

const { logAudit } = require("../src/utils/auditLogger");

let app;
let adminToken;

beforeAll(() => {
  const server = require("../src/server");
  app = server.app;
  adminToken = jwt.sign(
    { userId: "super-admin-id", role: "admin", adminRole: "super_admin" },
    process.env.JWT_SECRET
  );
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/admin/admins/send-verification", () => {
  it("sends a verification code to a new email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "newadmin@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification code sent");
    expect(res.body.devCode).toMatch(/^\d{6}$/);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "newadmin@test.com" },
    });
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email is required");
  });

  it("returns 400 when email already in use", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "existing-id" });

    const res = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "existing@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already in use");
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/admin/admins/send-verification")
      .send({ email: "test@test.com" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/admins/verify-email", () => {
  const email = "verify-email-test@test.com";
  let devCode;

  beforeEach(async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const sendRes = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email });
    devCode = sendRes.body.devCode;
    jest.clearAllMocks();
  });

  it("verifies email with correct code", async () => {
    const res = await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, code: devCode });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified");
    expect(res.body.verified).toBe(true);
  });

  it("returns 400 with invalid code", async () => {
    const res = await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, code: "000000" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid code");
  });

  it("returns 400 when no code was sent to this email", async () => {
    const res = await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "unknown@test.com", code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No code sent to this email");
  });
});

describe("POST /api/admin/admins/setup-2fa", () => {
  it("sets up Google Authenticator and returns secret", async () => {
    const res = await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "setup2fa@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.secret).toBe("MOCK_SECRET");
    expect(res.body.uri).toContain("otpauth://");
    expect(res.body.message).toBe("Scan QR code with Google Authenticator");
  });
});

describe("POST /api/admin/admins/verify-2fa", () => {
  it("verifies 2FA successfully after setup", async () => {
    const email = "verify2fa-flow@test.com";

    await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email });

    jest.clearAllMocks();

    const res = await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, token: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("2FA verified");
    expect(res.body.verified).toBe(true);
  });

  it("returns 400 when 2FA not initialized for this email", async () => {
    const res = await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "no-setup@test.com", token: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("2FA not initialized");
  });
});

describe("POST /api/admin/admins/create", () => {
  const email = "create-admin-flow@test.com";

  async function runFullVerification() {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const sendRes = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email });
    await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, code: sendRes.body.devCode });
    await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email });
    await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email, token: "123456" });
    jest.clearAllMocks();
  }

  it("creates an admin after full verification flow", async () => {
    await runFullVerification();

    mockPrisma.user.create.mockResolvedValue({
      id: "new-admin-id",
      email,
      firstName: "New",
      lastName: "Admin",
      adminRole: "admin",
    });

    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email,
        password: "StrongPass1",
        firstName: "New",
        lastName: "Admin",
        permissions: ["users.view", "users.edit"],
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin created");
    expect(res.body.admin.email).toBe(email);
    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.adminPermission.createMany).toHaveBeenCalledWith({
      data: [
        { adminId: "new-admin-id", permission: "users.view" },
        { adminId: "new-admin-id", permission: "users.edit" },
      ],
      skipDuplicates: true,
    });
    expect(logAudit).toHaveBeenCalledWith({
      adminId: "super-admin-id",
      action: "create_admin",
      resource: "admin",
      resourceId: "new-admin-id",
      details: { email, permissions: ["users.view", "users.edit"] },
    });
  });

  it("creates an admin without permissions", async () => {
    const emailNoPerms = "create-admin-no-perms@test.com";

    mockPrisma.user.findUnique.mockResolvedValue(null);
    const s1 = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNoPerms });
    await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNoPerms, code: s1.body.devCode });
    await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNoPerms });
    await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNoPerms, token: "123456" });

    jest.clearAllMocks();

    mockPrisma.user.create.mockResolvedValue({
      id: "admin-no-perms",
      email: emailNoPerms,
      firstName: "No",
      lastName: "Perms",
      adminRole: "admin",
    });

    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: emailNoPerms,
        password: "StrongPass1",
        firstName: "No",
        lastName: "Perms",
      });

    expect(res.status).toBe(200);
    expect(mockPrisma.adminPermission.createMany).not.toHaveBeenCalled();
  });

  it("returns 400 when email not verified", async () => {
    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "not-verified@test.com",
        password: "StrongPass1",
        firstName: "Test",
        lastName: "User",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email not verified");
  });

  it("returns 400 when email verified but 2FA not verified", async () => {
    const emailNo2fa = "no-2fa-create@test.com";

    mockPrisma.user.findUnique.mockResolvedValue(null);
    const s1 = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNo2fa });
    await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailNo2fa, code: s1.body.devCode });

    jest.clearAllMocks();

    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: emailNo2fa,
        password: "StrongPass1",
        firstName: "Test",
        lastName: "User",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("2FA not verified");
  });

  it("returns 400 for duplicate email (Prisma P2002)", async () => {
    const emailDup = "duplicate-admin@test.com";

    mockPrisma.user.findUnique.mockResolvedValue(null);
    const s1 = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailDup });
    await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailDup, code: s1.body.devCode });
    await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailDup });
    await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailDup, token: "123456" });

    jest.clearAllMocks();

    mockPrisma.user.create.mockRejectedValue({ code: "P2002" });

    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: emailDup,
        password: "StrongPass1",
        firstName: "Test",
        lastName: "User",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already in use");
  });

  it("returns 500 on unexpected error", async () => {
    const emailErr = "create-admin-error@test.com";

    mockPrisma.user.findUnique.mockResolvedValue(null);
    const s1 = await request(app)
      .post("/api/admin/admins/send-verification")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailErr });
    await request(app)
      .post("/api/admin/admins/verify-email")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailErr, code: s1.body.devCode });
    await request(app)
      .post("/api/admin/admins/setup-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailErr });
    await request(app)
      .post("/api/admin/admins/verify-2fa")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: emailErr, token: "123456" });

    jest.clearAllMocks();

    mockPrisma.user.create.mockRejectedValue(new Error("DB connection failed"));

    const res = await request(app)
      .post("/api/admin/admins/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: emailErr,
        password: "StrongPass1",
        firstName: "Test",
        lastName: "User",
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to create admin");
  });
});

describe("GET /api/admin/admins", () => {
  it("lists all admins", async () => {
    const mockAdmins = [
      {
        id: "admin-1",
        email: "admin1@test.com",
        firstName: "Admin",
        lastName: "One",
        adminRole: "super_admin",
        isActive: true,
        createdAt: new Date("2024-01-01"),
        lastLoginAt: null,
        googleAuthSecret: null,
        _count: { permissions: 0, auditLogs: 0 },
      },
      {
        id: "admin-2",
        email: "admin2@test.com",
        firstName: "Admin",
        lastName: "Two",
        adminRole: "admin",
        isActive: true,
        createdAt: new Date("2024-02-01"),
        lastLoginAt: null,
        googleAuthSecret: "secret123",
        _count: { permissions: 3, auditLogs: 5 },
      },
    ];
    mockPrisma.user.findMany.mockResolvedValue(mockAdmins);

    const res = await request(app)
      .get("/api/admin/admins")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.admins).toHaveLength(2);
    expect(res.body.admins[0].email).toBe("admin1@test.com");
    expect(res.body.admins[1].email).toBe("admin2@test.com");
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { role: "admin" },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        adminRole: true, isActive: true, createdAt: true,
        lastLoginAt: true, googleAuthSecret: true,
        _count: { select: { permissions: true, auditLogs: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/admin/admins");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/admin/admins/:id/permissions", () => {
  const targetId = "target-admin-id";

  it("updates admin permissions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: targetId,
      role: "admin",
      adminRole: "admin",
    });

    const res = await request(app)
      .put(`/api/admin/admins/${targetId}/permissions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ permissions: ["users.view", "users.edit", "analytics.view"] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Permissions updated");
    expect(mockPrisma.adminPermission.deleteMany).toHaveBeenCalledWith({
      where: { adminId: targetId },
    });
    expect(mockPrisma.adminPermission.createMany).toHaveBeenCalledWith({
      data: [
        { adminId: targetId, permission: "users.view" },
        { adminId: targetId, permission: "users.edit" },
        { adminId: targetId, permission: "analytics.view" },
      ],
    });
    expect(logAudit).toHaveBeenCalledWith({
      adminId: "super-admin-id",
      action: "update_admin_permissions",
      resource: "admin",
      resourceId: targetId,
      details: { permissions: ["users.view", "users.edit", "analytics.view"] },
    });
  });

  it("clears permissions when empty array provided", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: targetId,
      role: "admin",
      adminRole: "admin",
    });

    const res = await request(app)
      .put(`/api/admin/admins/${targetId}/permissions`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ permissions: [] });

    expect(res.status).toBe(200);
    expect(mockPrisma.adminPermission.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.adminPermission.createMany).not.toHaveBeenCalled();
  });

  it("returns 404 when admin not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/admin/admins/nonexistent/permissions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ permissions: [] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Admin not found");
  });

  it("returns 404 when target is not an admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "regular-user",
      role: "user",
    });

    const res = await request(app)
      .put("/api/admin/admins/regular-user/permissions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ permissions: [] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Admin not found");
  });

  it("returns 403 when target is super admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "super-id",
      role: "admin",
      adminRole: "super_admin",
    });

    const res = await request(app)
      .put("/api/admin/admins/super-id/permissions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ permissions: [] });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Cannot modify super admin");
  });
});

describe("DELETE /api/admin/admins/:id", () => {
  it("deletes an admin", async () => {
    const deleteId = "delete-target-id";
    mockPrisma.user.findUnique.mockResolvedValue({
      id: deleteId,
      role: "admin",
      adminRole: "admin",
    });

    const res = await request(app)
      .delete(`/api/admin/admins/${deleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin deleted");
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: deleteId },
    });
    expect(logAudit).toHaveBeenCalledWith({
      adminId: "super-admin-id",
      action: "delete_admin",
      resource: "admin",
      resourceId: deleteId,
    });
  });

  it("returns 404 when admin not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/admin/admins/nonexistent")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Admin not found");
  });

  it("returns 404 when target is not an admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "regular-user-id",
      role: "user",
    });

    const res = await request(app)
      .delete("/api/admin/admins/regular-user-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Admin not found");
  });

  it("returns 403 when target is super admin", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "super-admin-to-delete",
      role: "admin",
      adminRole: "super_admin",
    });

    const res = await request(app)
      .delete("/api/admin/admins/super-admin-to-delete")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Cannot delete super admin");
  });

  it("returns 403 when super admin tries to delete themselves (super_admin check takes precedence)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "super-admin-id",
      role: "admin",
      adminRole: "super_admin",
    });

    const res = await request(app)
      .delete("/api/admin/admins/super-admin-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Cannot delete super admin");
  });
});

describe("GET /api/admin/admins/permissions/list", () => {
  it("returns available permission groups", async () => {
    const res = await request(app)
      .get("/api/admin/admins/permissions/list")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.groups).toBeInstanceOf(Array);
    expect(res.body.groups.length).toBeGreaterThan(0);
    expect(res.body.groups[0]).toHaveProperty("group");
    expect(res.body.groups[0]).toHaveProperty("permissions");
  });

  it("returns 401 without token", async () => {
    const res = await request(app)
      .get("/api/admin/admins/permissions/list");
    expect(res.status).toBe(401);
  });
});

describe("RBAC middleware", () => {
  it("returns 403 when requester is not super admin", async () => {
    const regularToken = jwt.sign(
      { userId: "regular-admin-id", role: "admin", adminRole: "admin" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/admin/admins")
      .set("Authorization", `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Super admin access required");
  });

  it("returns 403 when requester is not an admin role", async () => {
    const userToken = jwt.sign(
      { userId: "regular-user-id", role: "user" },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/admin/admins")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });
});
