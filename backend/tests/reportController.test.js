const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  report: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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

describe("POST /api/reports", () => {
  it("creates a report successfully", async () => {
    const token = authedUser();
    const payload = { reportedUserId: "other-user-id", reason: "Harassment", description: "Sending inappropriate messages" };

    prisma.report.create.mockResolvedValue({
      id: "report-uuid",
      reporterId: "uuid-123",
      reportedUserId: "other-user-id",
      reason: "Harassment",
      description: "Sending inappropriate messages",
      status: "pending",
      reporter: { id: "uuid-123", firstName: "John", lastName: "Doe" },
      reportedUser: { id: "other-user-id", firstName: "Jane", lastName: "Doe" },
    });

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Report submitted successfully");
    expect(res.body.report.reason).toBe("Harassment");
    expect(res.body.report.status).toBe("pending");
    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: "uuid-123",
          reportedUserId: "other-user-id",
          reason: "Harassment",
          description: "Sending inappropriate messages",
        }),
      })
    );
  });

  it("returns 400 when reporting yourself", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({ reportedUserId: "uuid-123", reason: "Test", description: "Self report" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot report yourself");
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.report.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({ reportedUserId: "other-user", reason: "Test", description: "Test" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to submit report");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/reports")
      .send({ reportedUserId: "other-user", reason: "Test", description: "Test" });

    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", "Bearer invalid-token")
      .send({ reportedUserId: "other-user", reason: "Test", description: "Test" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /api/reports/admin/all", () => {
  it("returns all reports for admin", async () => {
    const token = authedUser({ role: "admin" });
    const mockReports = [
      {
        id: "r1",
        reporterId: "u1",
        reportedUserId: "u2",
        reason: "Harassment",
        status: "pending",
        reporter: { id: "u1", firstName: "John", lastName: "Doe", email: "john@example.com" },
        reportedUser: { id: "u2", firstName: "Jane", lastName: "Doe", email: "jane@example.com" },
      },
      {
        id: "r2",
        reporterId: "u3",
        reportedUserId: "u4",
        reason: "Spam",
        status: "resolved",
        reporter: { id: "u3", firstName: "Bob", lastName: "Smith", email: "bob@example.com" },
        reportedUser: { id: "u4", firstName: "Alice", lastName: "Jones", email: "alice@example.com" },
      },
    ];

    prisma.report.findMany.mockResolvedValue(mockReports);

    const res = await request(app)
      .get("/api/reports/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(2);
    expect(res.body.reports[0].reason).toBe("Harassment");
    expect(res.body.reports[1].reason).toBe("Spam");
  });

  it("filters by status query parameter", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.findMany.mockResolvedValue([
      { id: "r1", reason: "Harassment", status: "pending" },
    ]);

    const res = await request(app)
      .get("/api/reports/admin/all?status=pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns empty array when no reports match", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/reports/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.reports).toEqual([]);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/reports/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/reports/admin/all");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/reports/:id", () => {
  it("returns report by id", async () => {
    const token = authedUser();
    prisma.report.findUnique.mockResolvedValue({
      id: "report-uuid",
      reporterId: "uuid-123",
      reportedUserId: "other-user-id",
      reason: "Harassment",
      description: "Inappropriate messages",
      status: "pending",
      reporter: { id: "uuid-123", firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+251911000000" },
      reportedUser: { id: "other-user-id", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "+251922000000", profile: null },
    });

    const res = await request(app)
      .get("/api/reports/report-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.report.id).toBe("report-uuid");
    expect(res.body.report.reason).toBe("Harassment");
    expect(res.body.report.status).toBe("pending");
    expect(res.body.report.reporter.firstName).toBe("John");
    expect(res.body.report.reportedUser.firstName).toBe("Jane");
  });

  it("returns 404 for non-existent id", async () => {
    const token = authedUser();
    prisma.report.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/reports/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Report not found");
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.report.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/reports/report-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch report");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/reports/some-id");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/reports/some-id")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("PUT /api/reports/:id/status", () => {
  it("updates report status as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.update.mockResolvedValue({
      id: "report-uuid",
      status: "resolved",
      adminId: "uuid-123",
      adminNote: "Investigated and resolved",
    });

    const res = await request(app)
      .put("/api/reports/report-uuid/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolved", adminNote: "Investigated and resolved" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report status updated");
    expect(res.body.report.status).toBe("resolved");
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-uuid" },
        data: expect.objectContaining({
          status: "resolved",
          adminId: "uuid-123",
          adminNote: "Investigated and resolved",
        }),
      })
    );
  });

  it("updates status without admin note", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.update.mockResolvedValue({
      id: "report-uuid",
      status: "resolved",
    });

    const res = await request(app)
      .put("/api/reports/report-uuid/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolved" });

    expect(res.status).toBe(200);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .put("/api/reports/report-uuid/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "resolved" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .put("/api/reports/report-uuid/status")
      .send({ status: "resolved" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/reports/:id/dismiss", () => {
  it("dismisses report as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.update.mockResolvedValue({
      id: "report-uuid",
      status: "dismissed",
      adminId: "uuid-123",
      adminNote: "No evidence found",
    });

    const res = await request(app)
      .post("/api/reports/report-uuid/dismiss")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminNote: "No evidence found" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report dismissed");
    expect(res.body.report.status).toBe("dismissed");
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-uuid" },
        data: expect.objectContaining({
          status: "dismissed",
          adminId: "uuid-123",
          adminNote: "No evidence found",
        }),
      })
    );
  });

  it("dismisses without admin note", async () => {
    const token = authedUser({ role: "admin" });
    prisma.report.update.mockResolvedValue({
      id: "report-uuid",
      status: "dismissed",
    });

    const res = await request(app)
      .post("/api/reports/report-uuid/dismiss")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Report dismissed");
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .post("/api/reports/report-uuid/dismiss")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/reports/report-uuid/dismiss");
    expect(res.status).toBe(401);
  });
});
