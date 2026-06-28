const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  profile: {},
  match: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  favorite: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
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

function authedUser(overrides) {
  return jwt.sign({ userId: "uuid-123", role: "user", ...overrides }, process.env.JWT_SECRET);
}

describe("GET /api/matches/recommended", () => {
  it("returns recommended matches with scores", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      gender: "male",
      dateOfBirth: new Date("1990-01-01"),
      profile: {
        country: "Ethiopia",
        ethnicBackground: "Oromo",
        languages: ["Amharic", "Oromo"],
        spousePreference: {
          preferredAgeMin: 20,
          preferredAgeMax: 35,
        },
      },
    });
    prisma.user.findMany.mockResolvedValue([
      {
        id: "other-1",
        gender: "female",
        dateOfBirth: new Date("1995-06-15"),
        isVerified: true,
        profile: {
          country: "Ethiopia",
          maritalStatus: "single",
          religiousCommitment: "practicing",
          educationLevel: "bachelors",
          prayerHabits: "all_prayers",
          quranReadingFrequency: "daily",
          smokingHabits: "non_smoker",
          childrenStatus: "no_children",
          familyInvolvement: "involved",
          ethnicBackground: "Oromo",
          languages: ["Amharic"],
          isProfileComplete: true,
          spousePreference: {
            preferredAgeMin: 25,
            preferredAgeMax: 40,
            preferredReligiousCommitment: "practicing",
            preferredMaritalStatus: "single",
            preferredEducationLevel: "bachelors",
          },
        },
      },
    ]);

    const res = await request(app)
      .get("/api/matches/recommended")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toBeDefined();
    expect(res.body.matches.length).toBeGreaterThan(0);
    expect(res.body.matches[0].compatibilityScore).toBeDefined();
    expect(res.body.matches[0].compatibilityBreakdown).toBeDefined();
  });

  it("returns 400 when profile is incomplete", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({
      id: "uuid-123",
      gender: "male",
      profile: null,
    });

    const res = await request(app)
      .get("/api/matches/recommended")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Please complete your profile first");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matches/recommended");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/matches/recommended")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch matches");
  });
});

describe("GET /api/matches/search", () => {
  it("returns profiles matching search filters", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ gender: "male" });
    prisma.user.findMany.mockResolvedValue([
      {
        id: "other-1",
        gender: "female",
        dateOfBirth: new Date("1995-06-15"),
        firstName: "Jane",
        lastName: "Doe",
        isVerified: false,
        profile: {
          country: "Ethiopia",
          city: "Addis Ababa",
          maritalStatus: "single",
          educationLevel: "bachelors",
          religiousCommitment: "practicing",
          isProfileComplete: true,
          spousePreference: null,
        },
      },
    ]);

    const res = await request(app)
      .get("/api/matches/search?country=Ethiopia&maritalStatus=single")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profiles).toHaveLength(1);
    expect(res.body.profiles[0].firstName).toBe("Jane");
  });

  it("returns empty array when no matches found", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ gender: "male" });
    prisma.user.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/matches/search")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profiles).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matches/search");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ gender: "male" });
    prisma.user.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/matches/search")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to search profiles");
  });
});

describe("POST /api/matches/interest", () => {
  it("sends interest successfully", async () => {
    const token = authedUser();
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.create.mockResolvedValue({
      id: "match-1",
      userId: "uuid-123",
      matchedUserId: "other-1",
      status: "pending",
      user: { id: "uuid-123", firstName: "John", lastName: "Doe" },
      matchedUser: { id: "other-1", firstName: "Jane", lastName: "Doe" },
    });

    const res = await request(app)
      .post("/api/matches/interest")
      .set("Authorization", `Bearer ${token}`)
      .send({ matchedUserId: "other-1" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Interest sent successfully");
    expect(res.body.match.status).toBe("pending");
  });

  it("returns 400 if interest already sent", async () => {
    const token = authedUser();
    prisma.match.findFirst.mockResolvedValue({ id: "match-1" });

    const res = await request(app)
      .post("/api/matches/interest")
      .set("Authorization", `Bearer ${token}`)
      .send({ matchedUserId: "other-1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Interest already sent");
  });

  it("returns 400 if matchedUserId is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/matches/interest")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/matches/interest")
      .send({ matchedUserId: "other-1" });
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.match.findFirst.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/matches/interest")
      .set("Authorization", `Bearer ${token}`)
      .send({ matchedUserId: "other-1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to send interest");
  });

  it("returns 500 on create error", async () => {
    const token = authedUser();
    prisma.match.findFirst.mockResolvedValue(null);
    prisma.match.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/matches/interest")
      .set("Authorization", `Bearer ${token}`)
      .send({ matchedUserId: "other-1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to send interest");
  });
});

describe("PUT /api/matches/:id/respond", () => {
  it("responds to interest successfully", async () => {
    const token = authedUser();
    prisma.match.update.mockResolvedValue({
      id: "match-1",
      userId: "other-1",
      matchedUserId: "uuid-123",
      status: "accepted",
      user: { id: "other-1", firstName: "Jane", lastName: "Doe" },
      matchedUser: { id: "uuid-123", firstName: "John", lastName: "Doe" },
    });

    const res = await request(app)
      .put("/api/matches/match-1/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Interest response recorded");
    expect(res.body.match.status).toBe("accepted");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .put("/api/matches/match-1/respond")
      .send({ status: "accepted" });
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.match.update.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/api/matches/match-1/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to respond to interest");
  });

  it("returns 500 when match does not exist", async () => {
    const token = authedUser();
    prisma.match.update.mockRejectedValue({ code: "P2025" });

    const res = await request(app)
      .put("/api/matches/nonexistent/respond")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(500);
  });
});

describe("GET /api/matches/my-matches", () => {
  it("returns matches for the authenticated user", async () => {
    const token = authedUser();
    prisma.match.findMany.mockResolvedValue([
      {
        id: "match-1",
        status: "accepted",
        userId: "uuid-123",
        matchedUserId: "other-1",
        createdAt: new Date(),
        user: { id: "uuid-123", firstName: "John", lastName: "Doe", gender: "male", profile: {} },
        matchedUser: { id: "other-1", firstName: "Jane", lastName: "Doe", gender: "female", profile: {} },
      },
    ]);

    const res = await request(app)
      .get("/api/matches/my-matches")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].status).toBe("accepted");
  });

  it("filters matches by status", async () => {
    const token = authedUser();
    prisma.match.findMany.mockResolvedValue([
      {
        id: "match-2",
        status: "pending",
        userId: "other-1",
        matchedUserId: "uuid-123",
        createdAt: new Date(),
        user: { id: "other-1", firstName: "Jane", lastName: "Doe", gender: "female", profile: {} },
        matchedUser: { id: "uuid-123", firstName: "John", lastName: "Doe", gender: "male", profile: {} },
      },
    ]);

    const res = await request(app)
      .get("/api/matches/my-matches?status=pending")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].status).toBe("pending");
  });

  it("returns empty array when no matches exist", async () => {
    const token = authedUser();
    prisma.match.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/matches/my-matches")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.matches).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matches/my-matches");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.match.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/matches/my-matches")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch matches");
  });
});

describe("POST /api/matches/favorites", () => {
  it("adds user to favorites successfully", async () => {
    const token = authedUser();
    prisma.favorite.findUnique.mockResolvedValue(null);
    prisma.favorite.create.mockResolvedValue({
      id: "fav-1",
      userId: "uuid-123",
      favoritedUserId: "other-1",
    });

    const res = await request(app)
      .post("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ favoritedUserId: "other-1" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Added to favorites");
  });

  it("returns 400 if already in favorites", async () => {
    const token = authedUser();
    prisma.favorite.findUnique.mockResolvedValue({ id: "fav-1" });

    const res = await request(app)
      .post("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ favoritedUserId: "other-1" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Already in favorites");
  });

  it("returns 400 if favoritedUserId is missing", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/matches/favorites")
      .send({ favoritedUserId: "other-1" });
    expect(res.status).toBe(401);
  });

  it("returns 500 on create error", async () => {
    const token = authedUser();
    prisma.favorite.findUnique.mockResolvedValue(null);
    prisma.favorite.create.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ favoritedUserId: "other-1" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to add to favorites");
  });
});

describe("GET /api/matches/favorites", () => {
  it("returns favorites for the authenticated user", async () => {
    const token = authedUser();
    prisma.favorite.findMany.mockResolvedValue([
      {
        id: "fav-1",
        userId: "uuid-123",
        favoritedUserId: "other-1",
        createdAt: new Date(),
        user: { id: "other-1", firstName: "Jane", lastName: "Doe", gender: "female", profile: null },
      },
    ]);

    const res = await request(app)
      .get("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.favorites).toHaveLength(1);
    expect(res.body.favorites[0].user.firstName).toBe("Jane");
  });

  it("returns empty array when no favorites exist", async () => {
    const token = authedUser();
    prisma.favorite.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.favorites).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matches/favorites");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.favorite.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/matches/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch favorites");
  });
});

describe("DELETE /api/matches/favorites/:favoritedUserId", () => {
  it("removes user from favorites successfully", async () => {
    const token = authedUser();
    prisma.favorite.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .delete("/api/matches/favorites/other-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Removed from favorites");
  });

  it("succeeds even if favorite did not exist", async () => {
    const token = authedUser();
    prisma.favorite.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .delete("/api/matches/favorites/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Removed from favorites");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).delete("/api/matches/favorites/other-1");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.favorite.deleteMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .delete("/api/matches/favorites/other-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to remove from favorites");
  });
});
