const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  profile: { findUnique: jest.fn() },
  spousePreference: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
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

describe("POST /api/spouse-preference", () => {
  const validPayload = {
    minAge: 20,
    maxAge: 35,
    nationality: "Ethiopian",
    country: "Ethiopia",
    city: "Addis Ababa",
  };

  it("creates spouse preference when none exists", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockResolvedValue({ id: "profile-uuid", userId: "uuid-123" });
    prisma.spousePreference.findUnique.mockResolvedValue(null);
    prisma.spousePreference.create.mockResolvedValue({
      id: "pref-uuid",
      profileId: "profile-uuid",
      ...validPayload,
    });

    const res = await request(app)
      .post("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Spouse preferences updated successfully");
    expect(res.body.preference.minAge).toBe(20);
    expect(res.body.preference.nationality).toBe("Ethiopian");
    expect(prisma.spousePreference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ profileId: "profile-uuid", ...validPayload }),
      })
    );
    expect(prisma.spousePreference.update).not.toHaveBeenCalled();
  });

  it("updates existing spouse preference", async () => {
    const token = authedUser();
    const existingPref = {
      id: "pref-uuid",
      profileId: "profile-uuid",
      minAge: 18,
      maxAge: 40,
      nationality: "Ethiopian",
    };

    prisma.profile.findUnique.mockResolvedValue({ id: "profile-uuid", userId: "uuid-123" });
    prisma.spousePreference.findUnique.mockResolvedValue(existingPref);
    prisma.spousePreference.update.mockResolvedValue({ ...existingPref, minAge: 25, maxAge: 35 });

    const res = await request(app)
      .post("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`)
      .send({ minAge: 25, maxAge: 35 });

    expect(res.status).toBe(200);
    expect(res.body.preference.minAge).toBe(25);
    expect(res.body.preference.maxAge).toBe(35);
    expect(prisma.spousePreference.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: "profile-uuid" },
        data: expect.objectContaining({ minAge: 25, maxAge: 35 }),
      })
    );
    expect(prisma.spousePreference.create).not.toHaveBeenCalled();
  });

  it("returns 404 when profile does not exist", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`)
      .send({ minAge: 20 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Profile not found. Please complete your profile first.");
  });

  it("returns 500 on prisma error during profile lookup", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`)
      .send({ minAge: 20 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to update spouse preferences");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/spouse-preference")
      .send({ minAge: 20 });

    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .post("/api/spouse-preference")
      .set("Authorization", "Bearer invalid-token")
      .send({ minAge: 20 });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});

describe("GET /api/spouse-preference", () => {
  it("returns spouse preference", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      spousePreference: {
        id: "pref-uuid",
        minAge: 20,
        maxAge: 35,
        nationality: "Ethiopian",
        country: "Ethiopia",
        city: "Addis Ababa",
      },
    });

    const res = await request(app)
      .get("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.spousePreference).toBeDefined();
    expect(res.body.spousePreference.minAge).toBe(20);
    expect(res.body.spousePreference.nationality).toBe("Ethiopian");
  });

  it("returns null spouse preference when none set", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      spousePreference: null,
    });

    const res = await request(app)
      .get("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.spousePreference).toBeNull();
  });

  it("returns 404 when profile does not exist", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Profile not found");
  });

  it("returns 500 on prisma error", async () => {
    const token = authedUser();
    prisma.profile.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/spouse-preference")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch spouse preferences");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/spouse-preference");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/spouse-preference")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });
});
