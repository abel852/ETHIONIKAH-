const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  verification: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  user: { update: jest.fn() },
}));

jest.mock("../src/utils/notification", () => ({
  createNotification: jest.fn().mockResolvedValue({}),
  notifyAllAdmins: jest.fn().mockResolvedValue(),
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

describe("POST /api/verification", () => {
  it("submits verification successfully (new)", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue(null);
    prisma.verification.create.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "pending",
      idDocumentPath: "uploads/national-ids/test.jpg",
      selfiePath: "uploads/selfies/test.jpg",
    });

    const res = await request(app)
      .post("/api/verification")
      .set("Authorization", `Bearer ${token}`)
      .attach("idPhoto", Buffer.from("fake-image-data"), "id.jpg")
      .attach("selfiePhoto", Buffer.from("fake-image-data"), "selfie.jpg");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification submitted for review");
    expect(res.body.verification.status).toBe("pending");
    expect(prisma.verification.create).toHaveBeenCalledTimes(1);
    expect(prisma.verification.update).not.toHaveBeenCalled();
  });

  it("updates existing verification submission", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "rejected",
    });
    prisma.verification.update.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "pending",
      idDocumentPath: "uploads/national-ids/new.jpg",
      selfiePath: "uploads/selfies/new.jpg",
      adminId: null,
      adminNote: null,
      reviewedAt: null,
    });

    const res = await request(app)
      .post("/api/verification")
      .set("Authorization", `Bearer ${token}`)
      .attach("idPhoto", Buffer.from("fake-image-data"), "new-id.jpg")
      .attach("selfiePhoto", Buffer.from("fake-image-data"), "new-selfie.jpg");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification submitted for review");
    expect(res.body.verification.status).toBe("pending");
    expect(prisma.verification.update).toHaveBeenCalledTimes(1);
    expect(prisma.verification.create).not.toHaveBeenCalled();
  });

  it("returns 400 when idPhoto is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/verification")
      .set("Authorization", `Bearer ${token}`)
      .attach("selfiePhoto", Buffer.from("fake-image-data"), "selfie.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("National ID photo is required");
  });

  it("returns 400 when selfiePhoto is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/verification")
      .set("Authorization", `Bearer ${token}`)
      .attach("idPhoto", Buffer.from("fake-image-data"), "id.jpg");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Selfie photo is required");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/verification");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .post("/api/verification")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /api/verification/me", () => {
  it("returns verification status", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "pending",
      admin: null,
    });

    const res = await request(app)
      .get("/api/verification/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.verification.status).toBe("pending");
    expect(res.body.verification.admin).toBeNull();
  });

  it("returns 404 when no verification exists", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/verification/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No verification submission found");
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/verification/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch verification status");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/verification/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/verification/admin/all", () => {
  it("returns all verifications for admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.findMany.mockResolvedValue([
      { id: "ver-1", userId: "u1", status: "pending", user: { id: "u1", firstName: "John" }, admin: null },
      { id: "ver-2", userId: "u2", status: "approved", user: { id: "u2", firstName: "Jane" }, admin: { id: "a1", firstName: "Admin" } },
    ]);

    const res = await request(app)
      .get("/api/verification/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.verifications).toHaveLength(2);
    expect(res.body.verifications[0].id).toBe("ver-1");
    expect(res.body.verifications[1].id).toBe("ver-2");
  });

  it("filters by status query parameter", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.findMany.mockResolvedValue([
      { id: "ver-1", userId: "u1", status: "pending" },
    ]);

    const res = await request(app)
      .get("/api/verification/admin/all?status=pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.verifications).toHaveLength(1);
    expect(prisma.verification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns empty array when no verifications match", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/verification/admin/all?status=approved")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.verifications).toEqual([]);
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .get("/api/verification/admin/all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/verification/admin/all");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/verification/:id", () => {
  it("returns verification by id", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "approved",
      user: { id: "uuid-123", firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+251911000000" },
      admin: null,
    });

    const res = await request(app)
      .get("/api/verification/ver-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.verification.id).toBe("ver-uuid");
    expect(res.body.verification.status).toBe("approved");
    expect(res.body.verification.user.firstName).toBe("John");
  });

  it("returns 404 for non-existent id", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/verification/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Verification not found");
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.verification.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/verification/ver-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch verification");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/verification/some-id");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/verification/some-id")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("POST /api/verification/:id/approve", () => {
  it("approves verification as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.update.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "approved",
      adminNote: "Documents verified successfully",
      reviewedAt: new Date(),
    });
    prisma.user.update.mockResolvedValue({ id: "uuid-123", isVerified: true });

    const res = await request(app)
      .post("/api/verification/ver-uuid/approve")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminNote: "Documents verified successfully" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification approved");
    expect(res.body.verification.status).toBe("approved");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uuid-123" },
        data: { isVerified: true },
      })
    );
  });

  it("approves without admin note", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.update.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "approved",
      adminNote: null,
    });

    const res = await request(app)
      .post("/api/verification/ver-uuid/approve")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification approved");
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .post("/api/verification/ver-uuid/approve")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/verification/ver-uuid/approve");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/verification/:id/reject", () => {
  it("rejects verification as admin", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.update.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "rejected",
      adminNote: "Photo quality too low",
      reviewedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/verification/ver-uuid/reject")
      .set("Authorization", `Bearer ${token}`)
      .send({ adminNote: "Photo quality too low" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification rejected");
    expect(res.body.verification.status).toBe("rejected");
    expect(res.body.verification.adminNote).toBe("Photo quality too low");
  });

  it("rejects without admin note", async () => {
    const token = authedUser({ role: "admin" });
    prisma.verification.update.mockResolvedValue({
      id: "ver-uuid",
      userId: "uuid-123",
      status: "rejected",
      adminNote: null,
    });

    const res = await request(app)
      .post("/api/verification/ver-uuid/reject")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Verification rejected");
  });

  it("returns 403 for non-admin users", async () => {
    const token = authedUser({ role: "user" });

    const res = await request(app)
      .post("/api/verification/ver-uuid/reject")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/verification/ver-uuid/reject");
    expect(res.status).toBe(401);
  });
});
