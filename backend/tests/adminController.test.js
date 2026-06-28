const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    user: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn(), delete: jest.fn(), groupBy: jest.fn() },
    profile: { findMany: jest.fn(), count: jest.fn() },
    verification: { findMany: jest.fn(), count: jest.fn(), upsert: jest.fn(), findUnique: jest.fn() },
    match: { count: jest.fn() },
    message: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    payment: { aggregate: jest.fn(), findMany: jest.fn() },
    report: { findMany: jest.fn(), count: jest.fn() },
    complaint: { findMany: jest.fn(), count: jest.fn() },
    subscription: { count: jest.fn(), groupBy: jest.fn() },
    auditLog: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    systemSetting: { findMany: jest.fn(), upsert: jest.fn() },
    featureToggle: { findMany: jest.fn(), update: jest.fn() },
    adminPermission: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    contentFlag: { findMany: jest.fn(), update: jest.fn() },
    affiliateReferral: { findMany: jest.fn() },
    promotion: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    notificationTemplate: { findMany: jest.fn(), update: jest.fn() },
    userRestriction: { findMany: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    favorite: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock("../src/utils/auditLogger", () => ({
  logAudit: jest.fn(),
}));

jest.mock("../src/config/database", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("@prisma/client");
const { PrismaClient } = prisma;
const mockPrisma = new PrismaClient();

let app;
beforeAll(() => {
  const server = require("../src/server");
  app = server.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

function adminToken() {
  return jwt.sign({ userId: "admin-uuid", role: "admin" }, process.env.JWT_SECRET);
}

function userToken() {
  return jwt.sign({ userId: "user-uuid", role: "user" }, process.env.JWT_SECRET);
}

describe("GET /api/admin/users", () => {
  it("returns paginated users list", async () => {
    const token = adminToken();
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "uuid-1", firstName: "John", lastName: "Doe", email: "john@test.com", gender: "male", isActive: true, isVerified: true, createdAt: new Date(), profile: { country: "Ethiopia", city: "Addis Ababa", isProfileComplete: true }, verification: { status: "approved" }, restrictions: [] },
      { id: "uuid-2", firstName: "Jane", lastName: "Doe", email: "jane@test.com", gender: "female", isActive: true, isVerified: false, createdAt: new Date(), profile: { country: "Ethiopia", city: "Addis Ababa", isProfileComplete: false }, verification: null, restrictions: [] },
    ]);
    mockPrisma.user.count.mockResolvedValue(2);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.users[0].firstName).toBe("John");
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });

  it("returns 403 for non-admin users", async () => {
    const token = userToken();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/admin/users/:id", () => {
  it("returns a user by ID with relations", async () => {
    const token = adminToken();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "uuid-1",
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      gender: "male",
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      profile: { country: "Ethiopia", city: "Addis Ababa" },
      verification: { status: "approved" },
      restrictions: [],
      subscriptions: [],
      payments: [],
      sentMatches: [],
    });

    const res = await request(app)
      .get("/api/admin/users/uuid-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe("John");
    expect(res.body.user.email).toBe("john@test.com");
  });

  it("returns 404 when user not found", async () => {
    const token = adminToken();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/admin/users/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

describe("PUT /api/admin/users/:id/suspend", () => {
  it("suspends a user successfully", async () => {
    const token = adminToken();
    mockPrisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/admin/users/uuid-1/suspend")
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Violation of terms" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User suspended");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-1" },
        data: { isActive: false },
      })
    );
  });
});

describe("PUT /api/admin/users/:id/activate", () => {
  it("activates a user successfully", async () => {
    const token = adminToken();
    mockPrisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/admin/users/uuid-1/activate")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User activated");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-1" },
        data: { isActive: true },
      })
    );
  });
});

describe("DELETE /api/admin/users/:id", () => {
  it("deletes a user successfully", async () => {
    const token = adminToken();
    mockPrisma.user.delete.mockResolvedValue({});

    const res = await request(app)
      .delete("/api/admin/users/uuid-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted");
    expect(mockPrisma.user.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "uuid-1" } })
    );
  });
});

describe("POST /api/admin/users/:id/verify", () => {
  it("verifies a user successfully", async () => {
    const token = adminToken();
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.verification.upsert.mockResolvedValue({});

    const res = await request(app)
      .post("/api/admin/users/uuid-1/verify")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User verified");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-1" },
        data: { isVerified: true },
      })
    );
    expect(mockPrisma.verification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-1" },
        create: expect.objectContaining({ userId: "uuid-1", status: "approved" }),
      })
    );
  });
});

describe("GET /api/admin/dashboard", () => {
  it("returns dashboard data with all stats", async () => {
    const token = adminToken();
    mockPrisma.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(75)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(10);
    mockPrisma.match.count.mockResolvedValue(200);
    mockPrisma.message.count
      .mockResolvedValueOnce(5000)
      .mockResolvedValueOnce(300);
    mockPrisma.payment.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 50000 } })
      .mockResolvedValueOnce({ _sum: { amount: 5000 } });
    mockPrisma.verification.count.mockResolvedValue(5);
    mockPrisma.report.count.mockResolvedValue(3);
    mockPrisma.complaint.count.mockResolvedValue(2);
    mockPrisma.subscription.count
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(30);
    mockPrisma.user.groupBy.mockResolvedValue([
      { gender: "male", _count: 60 },
      { gender: "female", _count: 40 },
    ]);
    mockPrisma.subscription.groupBy.mockResolvedValue([
      { planType: "premium", _count: 20 },
      { planType: "basic", _count: 10 },
    ]);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.verification.findMany.mockResolvedValue([]);
    mockPrisma.payment.findMany.mockResolvedValue([]);
    mockPrisma.report.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.dashboard.stats.totalUsers).toBe(100);
    expect(res.body.dashboard.stats.activeUsers).toBe(75);
    expect(res.body.dashboard.stats.verifiedUsers).toBe(50);
    expect(res.body.dashboard.stats.newUsersThisMonth).toBe(10);
    expect(res.body.dashboard.stats.totalMatches).toBe(200);
    expect(res.body.dashboard.stats.totalMessages).toBe(5000);
    expect(res.body.dashboard.stats.unreadMessages).toBe(300);
    expect(res.body.dashboard.stats.totalRevenue).toBe(50000);
    expect(res.body.dashboard.stats.revenueThisMonth).toBe(5000);
    expect(res.body.dashboard.stats.pendingVerifications).toBe(5);
    expect(res.body.dashboard.stats.openReports).toBe(3);
    expect(res.body.dashboard.stats.openComplaints).toBe(2);
    expect(res.body.dashboard.stats.activeSubscriptions).toBe(30);
    expect(res.body.dashboard.genderDistribution).toHaveLength(2);
    expect(res.body.dashboard.subscriptionBreakdown).toHaveLength(2);
    expect(res.body.dashboard.activities).toBeDefined();
  });
});

describe("GET /api/admin/analytics", () => {
  it("returns analytics data", async () => {
    const token = adminToken();
    mockPrisma.user.count.mockResolvedValue(100);
    mockPrisma.user.groupBy.mockResolvedValue([
      { createdAt: new Date("2025-01-01"), _count: 5 },
    ]);

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics.totalUsers).toBe(100);
    expect(res.body.analytics.monthlyGrowth).toHaveLength(1);
  });
});

describe("GET /api/admin/settings", () => {
  it("returns system settings as key-value map", async () => {
    const token = adminToken();
    mockPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "site_name", value: "Ethio Nikah", category: "branding" },
      { key: "default_language", value: "en", category: "localization" },
    ]);

    const res = await request(app)
      .get("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.settings.site_name).toBe("Ethio Nikah");
    expect(res.body.settings.default_language).toBe("en");
  });
});

describe("PUT /api/admin/settings", () => {
  it("updates a system setting", async () => {
    const token = adminToken();
    mockPrisma.systemSetting.upsert.mockResolvedValue({
      key: "site_name",
      value: "New Site Name",
      category: "general",
    });

    const res = await request(app)
      .put("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "site_name", value: "New Site Name" });

    expect(res.status).toBe(200);
    expect(res.body.setting.value).toBe("New Site Name");
    expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "site_name" },
        update: { value: "New Site Name" },
        create: expect.objectContaining({ key: "site_name", value: "New Site Name" }),
      })
    );
  });
});

describe("GET /api/admin/audit-logs", () => {
  it("returns paginated audit logs", async () => {
    const token = adminToken();
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { id: "log-1", action: "admin_login", resource: "auth", createdAt: new Date(), admin: { id: "admin-uuid", firstName: "Admin", lastName: "User", email: "admin@test.com" } },
    ]);
    mockPrisma.auditLog.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/admin/audit-logs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.logs).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.logs[0].action).toBe("admin_login");
  });
});
