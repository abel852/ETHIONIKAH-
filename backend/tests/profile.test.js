const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

const mockProfile = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock("multer", () => {
  const multerMock = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      req.file = { filename: "test-photo-123.jpg" };
      next();
    }),
    fields: jest.fn(() => (req, res, next) => next()),
    array: jest.fn(() => (req, res, next) => next()),
  }));
  multerMock.diskStorage = jest.fn(() => ({
    destination: (req, file, cb) => cb(null, ""),
    filename: (req, file, cb) => cb(null, "test.jpg"),
  }));
  return multerMock;
});

jest.mock("../src/config/database", () => ({
  profile: mockProfile,
  user: {
    findUnique: jest.fn(),
  },
}));

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

describe("GET /api/profile/me", () => {
  it("returns the authenticated user profile", async () => {
    const token = authedUser();
    mockProfile.findUnique.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "Hello world",
      nationality: "Ethiopian",
      country: "Ethiopia",
      city: "Addis Ababa",
      photos: [],
      isProfileComplete: true,
      user: { id: "uuid-123", firstName: "John", lastName: "Doe" },
      spousePreference: null,
    });

    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe("Hello world");
    expect(res.body.profile.nationality).toBe("Ethiopian");
    expect(res.body.profile.user.firstName).toBe("John");
  });

  it("returns empty profile when no profile exists", async () => {
    const token = authedUser();
    mockProfile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/profile/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile).toEqual({});
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/profile/me");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/profile", () => {
  it("creates a new profile when none exists", async () => {
    const token = authedUser();
    const payload = {
      bio: "New bio",
      nationality: "Ethiopian",
      country: "Ethiopia",
      city: "Addis Ababa",
    };

    mockProfile.findUnique.mockResolvedValue(null);
    mockProfile.create.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      ...payload,
      photos: [],
      isProfileComplete: false,
    });

    const res = await request(app)
      .post("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe("New bio");
    expect(mockProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "uuid-123", bio: "New bio" }),
      })
    );
  });

  it("updates an existing profile", async () => {
    const token = authedUser();
    const existingProfile = {
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "Old bio",
      nationality: "Ethiopian",
      country: "Ethiopia",
      city: "Addis Ababa",
      photos: [],
      isProfileComplete: true,
    };

    mockProfile.findUnique.mockResolvedValue(existingProfile);
    mockProfile.update.mockResolvedValue({ ...existingProfile, bio: "Updated bio" });

    const res = await request(app)
      .post("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "Updated bio" });

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe("Updated bio");
    expect(mockProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-123" },
        data: expect.objectContaining({ bio: "Updated bio" }),
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/profile").send({ bio: "test" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/profile/:id", () => {
  it("returns a profile by ID", async () => {
    mockProfile.findUnique.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "Profile bio",
      nationality: "Ethiopian",
      country: "Ethiopia",
      city: "Addis Ababa",
      photos: [],
      isProfileComplete: true,
      user: { id: "uuid-123", firstName: "John", lastName: "Doe", gender: "male", dateOfBirth: "1995-06-15", isVerified: true, createdAt: new Date().toISOString() },
      spousePreference: null,
    });

    const res = await request(app).get("/api/profile/profile-uuid");

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe("Profile bio");
    expect(res.body.profile.user.firstName).toBe("John");
    expect(mockProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "profile-uuid" } })
    );
  });

  it("returns 404 when profile not found", async () => {
    mockProfile.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/profile/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Profile not found");
  });
});

describe("POST /api/profile/step", () => {
  it("updates an existing profile step", async () => {
    const token = authedUser();
    const existingProfile = {
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "Old bio",
      photos: [],
      isProfileComplete: false,
    };

    mockProfile.findUnique.mockResolvedValue(existingProfile);
    mockProfile.update.mockResolvedValue({ ...existingProfile, bio: "Updated bio", nationality: "Ethiopian" });

    const res = await request(app)
      .post("/api/profile/step")
      .set("Authorization", `Bearer ${token}`)
      .send({ step: 2, data: { bio: "Updated bio", nationality: "Ethiopian" } });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Step 2 completed successfully");
    expect(res.body.profile.bio).toBe("Updated bio");
    expect(res.body.completedStep).toBe(2);
    expect(mockProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-123" },
        data: { bio: "Updated bio", nationality: "Ethiopian" },
      })
    );
  });

  it("creates a new profile when none exists for step", async () => {
    const token = authedUser();

    mockProfile.findUnique.mockResolvedValue(null);
    mockProfile.create.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "New bio",
      nationality: "Ethiopian",
      photos: [],
      isProfileComplete: false,
    });

    const res = await request(app)
      .post("/api/profile/step")
      .set("Authorization", `Bearer ${token}`)
      .send({ step: 1, data: { bio: "New bio", nationality: "Ethiopian" } });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Step 1 completed successfully");
    expect(mockProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "uuid-123", bio: "New bio" }),
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/profile/step").send({ step: 1, data: {} });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/profile/photo", () => {
  it("uploads a photo when profile exists", async () => {
    const token = authedUser();
    const existingProfile = {
      id: "profile-uuid",
      userId: "uuid-123",
      photos: ["/uploads/old-photo.jpg"],
      isProfileComplete: false,
    };

    mockProfile.findUnique.mockResolvedValue(existingProfile);
    mockProfile.update.mockResolvedValue({
      ...existingProfile,
      photos: ["/uploads/test-photo-123.jpg", "/uploads/old-photo.jpg"],
    });

    const res = await request(app)
      .post("/api/profile/photo")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Photo uploaded successfully");
    expect(res.body.photoUrl).toBe("/uploads/test-photo-123.jpg");
    expect(mockProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-123" },
        data: { photos: ["/uploads/test-photo-123.jpg", "/uploads/old-photo.jpg"] },
      })
    );
  });

  it("creates profile and uploads photo when no profile exists", async () => {
    const token = authedUser();

    mockProfile.findUnique.mockResolvedValue(null);
    mockProfile.create.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      photos: ["/uploads/test-photo-123.jpg"],
      isProfileComplete: false,
    });

    const res = await request(app)
      .post("/api/profile/photo")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Photo uploaded successfully");
    expect(res.body.photoUrl).toBe("/uploads/test-photo-123.jpg");
    expect(mockProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: "uuid-123", photos: ["/uploads/test-photo-123.jpg"] },
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/profile/photo");
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/profile/photo", () => {
  it("deletes a photo successfully", async () => {
    const token = authedUser();
    const existingProfile = {
      id: "profile-uuid",
      userId: "uuid-123",
      photos: ["/uploads/photo1.jpg", "/uploads/photo2.jpg"],
      isProfileComplete: true,
    };

    mockProfile.findUnique.mockResolvedValue(existingProfile);
    mockProfile.update.mockResolvedValue({
      ...existingProfile,
      photos: ["/uploads/photo2.jpg"],
    });

    const res = await request(app)
      .delete("/api/profile/photo")
      .set("Authorization", `Bearer ${token}`)
      .send({ photoUrl: "/uploads/photo1.jpg" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Photo deleted successfully");
    expect(mockProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-123" },
        data: { photos: ["/uploads/photo2.jpg"] },
      })
    );
  });

  it("returns 404 when profile not found", async () => {
    const token = authedUser();
    mockProfile.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/profile/photo")
      .set("Authorization", `Bearer ${token}`)
      .send({ photoUrl: "/uploads/photo1.jpg" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Profile not found");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).delete("/api/profile/photo").send({ photoUrl: "/uploads/photo1.jpg" });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/profile/complete", () => {
  it("marks profile as complete", async () => {
    const token = authedUser();
    mockProfile.update.mockResolvedValue({
      id: "profile-uuid",
      userId: "uuid-123",
      bio: "Complete profile",
      photos: [],
      isProfileComplete: true,
    });

    const res = await request(app)
      .post("/api/profile/complete")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Profile marked as complete");
    expect(res.body.profile.isProfileComplete).toBe(true);
    expect(mockProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "uuid-123" },
        data: { isProfileComplete: true },
      })
    );
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/profile/complete");
    expect(res.status).toBe(401);
  });
});
