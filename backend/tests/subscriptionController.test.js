const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  $queryRaw: jest.fn(),
  subscription: { findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), groupBy: jest.fn() },
  payment: { create: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(), count: jest.fn() },
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

function futureDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
}

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------

describe("GET /api/subscriptions/admin/subscriptions", () => {
  it("returns all subscriptions with pagination for admin", async () => {
    const token = authedUser({ role: "admin" });
    const mockSubs = [
      { id: "sub-1", userId: "u1", planType: "premium", status: "active", user: { id: "u1", email: "a@b.com", firstName: "A", lastName: "B" }, payments: [] },
    ];

    prisma.subscription.findMany.mockResolvedValue(mockSubs);
    prisma.subscription.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/subscriptions/admin/subscriptions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.totalPages).toBe(1);
  });

  it("filters by status and planType", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.findMany.mockResolvedValue([]);
    prisma.subscription.count.mockResolvedValue(0);

    await request(app)
      .get("/api/subscriptions/admin/subscriptions?status=active&planType=premium")
      .set("Authorization", `Bearer ${token}`);

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "active", planType: "premium" },
      })
    );
  });

  it("respects page and limit query params", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.findMany.mockResolvedValue([]);
    prisma.subscription.count.mockResolvedValue(0);

    await request(app)
      .get("/api/subscriptions/admin/subscriptions?page=2&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    );
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/subscriptions/admin/subscriptions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/subscriptions/admin/subscriptions");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/subscriptions/admin/subscriptions/:id", () => {
  it("returns subscription by id for admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      userId: "u1",
      planType: "premium",
      status: "active",
      user: { id: "u1", email: "a@b.com", firstName: "A", lastName: "B" },
      payments: [],
    });

    const res = await request(app)
      .get("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("sub-1");
    expect(res.body.data.planType).toBe("premium");
  });

  it("returns 404 when subscription not found", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/subscriptions/admin/subscriptions/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Subscription not found");
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/subscriptions/admin/subscriptions/sub-1");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/subscriptions/admin/revenue", () => {
  it("returns revenue statistics for admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.payment.aggregate.mockResolvedValue({
      _sum: { amount: 5000 },
      _count: 10,
    });
    prisma.subscription.count
      .mockResolvedValueOnce(15)  // activeSubscriptions
      .mockResolvedValueOnce(10)  // premiumSubscriptions
      .mockResolvedValueOnce(5);  // basicSubscriptions
    prisma.$queryRaw.mockResolvedValue([
      { plan_type: "premium", count: 10, revenue: 4000 },
      { plan_type: "basic", count: 5, revenue: 1000 },
    ]);

    const res = await request(app)
      .get("/api/subscriptions/admin/revenue")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRevenue).toBe(5000);
    expect(res.body.data.totalPayments).toBe(10);
    expect(res.body.data.activeSubscriptions).toBe(15);
    expect(res.body.data.premiumSubscriptions).toBe(10);
    expect(res.body.data.basicSubscriptions).toBe(5);
    expect(res.body.data.revenueByPlan).toHaveLength(2);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/subscriptions/admin/revenue")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/subscriptions/admin/revenue");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/subscriptions/admin/payments", () => {
  it("returns all payments with pagination for admin", async () => {
    const token = authedUser({ role: "admin" });
    const mockPayments = [
      { id: "pay-1", userId: "u1", amount: 500, currency: "ETB", status: "completed", user: { id: "u1", email: "a@b.com", firstName: "A", lastName: "B" }, subscription: null },
    ];

    prisma.payment.findMany.mockResolvedValue(mockPayments);
    prisma.payment.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/subscriptions/admin/payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it("filters payments by status", async () => {
    const token = authedUser({ role: "admin" });
    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.count.mockResolvedValue(0);

    await request(app)
      .get("/api/subscriptions/admin/payments?status=completed")
      .set("Authorization", `Bearer ${token}`);

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "completed" },
      })
    );
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/subscriptions/admin/payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/subscriptions/admin/payments");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/subscriptions/admin/subscriptions/:id", () => {
  it("updates subscription as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.update.mockResolvedValue({
      id: "sub-1",
      status: "active",
      autoRenew: true,
      planType: "premium",
      payment: { id: "pay-1", amount: 500 },
    });

    const res = await request(app)
      .put("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active", autoRenew: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("active");
    expect(res.body.data.autoRenew).toBe(true);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .put("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active" });

    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .put("/api/subscriptions/admin/subscriptions/sub-1")
      .send({ status: "active" });

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/subscriptions/admin/subscriptions/:id", () => {
  it("cancels subscription as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.subscription.update.mockResolvedValue({
      id: "sub-1",
      status: "cancelled",
      autoRenew: false,
      payment: { id: "pay-1" },
    });

    const res = await request(app)
      .delete("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("cancelled");
    expect(res.body.data.autoRenew).toBe(false);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1" },
        data: expect.objectContaining({
          status: "cancelled",
          autoRenew: false,
        }),
      })
    );
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .delete("/api/subscriptions/admin/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).delete("/api/subscriptions/admin/subscriptions/sub-1");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// User routes
// ---------------------------------------------------------------------------

describe("GET /api/subscriptions/my", () => {
  it("returns the authenticated user's subscription", async () => {
    const token = authedUser();
    const end = futureDate();
    prisma.subscription.findFirst.mockResolvedValue({
      id: "sub-1",
      userId: "uuid-123",
      planType: "premium",
      status: "active",
      startDate: new Date(),
      endDate: end,
      payment: { id: "pay-1", amount: 500, currency: "ETB", status: "completed" },
    });

    const res = await request(app)
      .get("/api/subscriptions/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.planType).toBe("premium");
    expect(res.body.data.status).toBe("active");
  });

  it("returns null when user has no subscription", async () => {
    const token = authedUser();
    prisma.subscription.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/subscriptions/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.subscription.findFirst.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/subscriptions/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Failed to fetch subscription");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/subscriptions/my");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/subscriptions/my")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("POST /api/subscriptions", () => {
  it("creates a new premium subscription", async () => {
    const token = authedUser();
    const payload = { planType: "premium", paymentMethod: "telebirr", transactionId: "txn-001" };

    prisma.payment.create.mockResolvedValue({
      id: "pay-1",
      userId: "uuid-123",
      amount: 500,
      currency: "ETB",
      status: "completed",
      paymentMethod: "telebirr",
      transactionId: "txn-001",
    });

    prisma.subscription.create.mockResolvedValue({
      id: "sub-1",
      userId: "uuid-123",
      planType: "premium",
      status: "active",
      startDate: new Date(),
      endDate: futureDate(),
      paymentId: "pay-1",
      payment: { id: "pay-1", amount: 500 },
    });

    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.planType).toBe("premium");
    expect(res.body.data.status).toBe("active");
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "uuid-123",
          amount: 500,
          currency: "ETB",
          status: "completed",
          paymentMethod: "telebirr",
          transactionId: "txn-001",
        }),
      })
    );
  });

  it("creates a new basic subscription", async () => {
    const token = authedUser();
    prisma.payment.create.mockResolvedValue({
      id: "pay-1",
      amount: 200,
      status: "completed",
    });
    prisma.subscription.create.mockResolvedValue({
      id: "sub-1",
      planType: "basic",
      status: "active",
      payment: { id: "pay-1", amount: 200 },
    });

    const res = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${token}`)
      .send({ planType: "basic", paymentMethod: "cash", transactionId: "txn-002" });

    expect(res.status).toBe(201);
    expect(res.body.data.planType).toBe("basic");
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 200 }),
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/subscriptions")
      .send({ planType: "premium", paymentMethod: "card", transactionId: "txn" });

    expect(res.status).toBe(401);
  });
});

describe("PUT /api/subscriptions/:id", () => {
  it("updates subscription status", async () => {
    const token = authedUser();
    prisma.subscription.update.mockResolvedValue({
      id: "sub-1",
      userId: "uuid-123",
      status: "active",
      autoRenew: true,
      payment: { id: "pay-1" },
    });

    const res = await request(app)
      .put("/api/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ autoRenew: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.autoRenew).toBe(true);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1" },
        data: expect.objectContaining({ autoRenew: true }),
      })
    );
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.subscription.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/api/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Failed to update subscription");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .put("/api/subscriptions/sub-1")
      .send({ status: "active" });

    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .put("/api/subscriptions/sub-1")
      .set("Authorization", "Bearer invalid-token")
      .send({ status: "active" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("DELETE /api/subscriptions/:id", () => {
  it("cancels subscription for user", async () => {
    const token = authedUser();
    prisma.subscription.update.mockResolvedValue({
      id: "sub-1",
      userId: "uuid-123",
      status: "cancelled",
      autoRenew: false,
      payment: { id: "pay-1" },
    });

    const res = await request(app)
      .delete("/api/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("cancelled");
    expect(res.body.data.autoRenew).toBe(false);
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.subscription.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .delete("/api/subscriptions/sub-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Failed to cancel subscription");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).delete("/api/subscriptions/sub-1");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .delete("/api/subscriptions/sub-1")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});
