const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  notification: { findMany: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
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

describe("GET /api/notifications", () => {
  it("returns notifications for the authenticated user", async () => {
    const token = authedUser();
    const now = new Date();
    prisma.notification.findMany.mockResolvedValue([
      { id: "notif-1", userId: "uuid-123", type: "interest_received", title: "New Interest", message: "Someone sent you interest", isRead: false, createdAt: now },
      { id: "notif-2", userId: "uuid-123", type: "match_accepted", title: "Match Accepted", message: "Your match was accepted", isRead: true, createdAt: now },
    ]);

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.notifications[0].type).toBe("interest_received");
    expect(res.body.notifications[1].type).toBe("match_accepted");
  });

  it("returns empty array when no notifications exist", async () => {
    const token = authedUser();
    prisma.notification.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.notification.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch notifications");
  });
});

describe("PUT /api/notifications/:id/read", () => {
  it("marks a notification as read", async () => {
    const token = authedUser();
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .put("/api/notifications/notif-1/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Notification marked as read");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).put("/api/notifications/notif-1/read");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.notification.updateMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/api/notifications/notif-1/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to mark notification");
  });
});

describe("PUT /api/notifications/read-all", () => {
  it("marks all notifications as read", async () => {
    const token = authedUser();
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const res = await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All notifications marked as read");
  });

  it("succeeds when no unread notifications exist", async () => {
    const token = authedUser();
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All notifications marked as read");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).put("/api/notifications/read-all");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.notification.updateMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to mark notifications");
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns the count of unread notifications", async () => {
    const token = authedUser();
    prisma.notification.count.mockResolvedValue(3);

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
  });

  it("returns zero when no unread notifications exist", async () => {
    const token = authedUser();
    prisma.notification.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/notifications/unread-count");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.notification.count.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to get unread count");
  });
});
