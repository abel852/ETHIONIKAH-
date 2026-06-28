const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  complaint: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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

describe("POST /api/complaints", () => {
  it("creates a complaint successfully", async () => {
    const token = authedUser();
    const payload = { subject: "Harassment", description: "User sent inappropriate messages" };

    prisma.complaint.create.mockResolvedValue({
      id: "complaint-uuid",
      userId: "uuid-123",
      ...payload,
      status: "open",
      user: { id: "uuid-123", firstName: "John", lastName: "Doe", email: "john@example.com" },
    });

    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Complaint submitted successfully");
    expect(res.body.complaint.subject).toBe("Harassment");
    expect(res.body.complaint.description).toBe("User sent inappropriate messages");
    expect(res.body.complaint.status).toBe("open");
    expect(prisma.complaint.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "uuid-123",
          subject: "Harassment",
          description: "User sent inappropriate messages",
        }),
      })
    );
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.complaint.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${token}`)
      .send({ subject: "Test", description: "Test" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to submit complaint");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .send({ subject: "Test", description: "Test" });

    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", "Bearer invalid-token")
      .send({ subject: "Test", description: "Test" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /api/complaints/admin/all", () => {
  it("returns all complaints for admin", async () => {
    const token = authedUser({ role: "admin" });
    const mockComplaints = [
      {
        id: "c1",
        userId: "u1",
        subject: "Harassment",
        status: "open",
        user: { id: "u1", firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+251911000000" },
        admin: null,
      },
      {
        id: "c2",
        userId: "u2",
        subject: "Spam",
        status: "resolved",
        user: { id: "u2", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "+251922000000" },
        admin: { id: "a1", firstName: "Admin", lastName: "User" },
      },
    ];

    prisma.complaint.findMany.mockResolvedValue(mockComplaints);

    const res = await request(app)
      .get("/api/complaints/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.complaints).toHaveLength(2);
    expect(res.body.complaints[0].subject).toBe("Harassment");
    expect(res.body.complaints[1].subject).toBe("Spam");
  });

  it("filters by status query parameter", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.findMany.mockResolvedValue([
      { id: "c1", userId: "u1", subject: "Harassment", status: "open" },
    ]);

    const res = await request(app)
      .get("/api/complaints/admin/all?status=open")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.complaints).toHaveLength(1);
    expect(prisma.complaint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns empty array when no complaints", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/complaints/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.complaints).toEqual([]);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/complaints/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/complaints/admin/all");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/complaints/:id", () => {
  it("returns complaint by id", async () => {
    const token = authedUser();
    prisma.complaint.findUnique.mockResolvedValue({
      id: "complaint-uuid",
      userId: "uuid-123",
      subject: "Harassment",
      description: "Inappropriate messages",
      status: "open",
      user: { id: "uuid-123", firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+251911000000" },
      admin: null,
    });

    const res = await request(app)
      .get("/api/complaints/complaint-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.complaint.id).toBe("complaint-uuid");
    expect(res.body.complaint.subject).toBe("Harassment");
    expect(res.body.complaint.status).toBe("open");
  });

  it("returns 404 for non-existent id", async () => {
    const token = authedUser();
    prisma.complaint.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/complaints/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Complaint not found");
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.complaint.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/complaints/complaint-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch complaint");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/complaints/some-id");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/complaints/some-id")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("POST /api/complaints/:id/respond", () => {
  it("responds to complaint as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.update.mockResolvedValue({
      id: "complaint-uuid",
      userId: "u1",
      subject: "Harassment",
      adminResponse: "We have reviewed and taken action",
      status: "resolved",
      adminId: "uuid-123",
    });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminResponse: "We have reviewed and taken action", status: "resolved" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Response submitted successfully");
    expect(res.body.complaint.adminResponse).toBe("We have reviewed and taken action");
    expect(res.body.complaint.status).toBe("resolved");
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "complaint-uuid" },
        data: expect.objectContaining({
          adminResponse: "We have reviewed and taken action",
          status: "resolved",
          adminId: "uuid-123",
        }),
      })
    );
  });

  it("defaults status to resolved when not provided", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.update.mockResolvedValue({
      id: "complaint-uuid",
      status: "resolved",
      adminResponse: "Handled",
    });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminResponse: "Handled" });

    expect(res.status).toBe(200);
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "resolved" }),
      })
    );
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminResponse: "Response" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/complaints/complaint-uuid/respond")
      .send({ adminResponse: "Response" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/complaints/:id/close", () => {
  it("closes complaint as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.update.mockResolvedValue({
      id: "complaint-uuid",
      userId: "u1",
      subject: "Harassment",
      status: "resolved",
      adminResponse: "Issue resolved",
      adminId: "uuid-123",
    });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/close")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminResponse: "Issue resolved" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Complaint closed");
    expect(res.body.complaint.status).toBe("resolved");
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "complaint-uuid" },
        data: expect.objectContaining({
          status: "resolved",
          adminResponse: "Issue resolved",
          adminId: "uuid-123",
        }),
      })
    );
  });

  it("closes complaint without admin response", async () => {
    const token = authedUser({ role: "admin" });
    prisma.complaint.update.mockResolvedValue({
      id: "complaint-uuid",
      status: "resolved",
      adminResponse: null,
    });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/close")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Complaint closed");
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .post("/api/complaints/complaint-uuid/close")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/complaints/complaint-uuid/close");
    expect(res.status).toBe(401);
  });
});
