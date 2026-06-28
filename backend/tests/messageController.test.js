const request = require("supertest");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

jest.mock("../src/config/database", () => ({
  user: { findUnique: jest.fn() },
  message: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  userRestriction: { findFirst: jest.fn() },
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

describe("POST /api/messages", () => {
  const payload = { receiverId: "other-1", content: "Hello, how are you?" };

  it("sends a message successfully", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ isVerified: true, isActive: true });
    prisma.userRestriction.findFirst.mockResolvedValue(null);
    prisma.message.findFirst.mockResolvedValue(null);
    prisma.message.create.mockResolvedValue({
      id: "msg-1",
      senderId: "uuid-123",
      receiverId: "other-1",
      content: payload.content,
      createdAt: new Date(),
      isRead: false,
      sender: { id: "uuid-123", firstName: "John", lastName: "Doe" },
      receiver: { id: "other-1", firstName: "Jane", lastName: "Doe" },
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message.content).toBe(payload.content);
    expect(res.body.message.sender.firstName).toBe("John");
  });

  it("returns 400 when sending message to yourself", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ receiverId: "uuid-123", content: "Hello self" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot send message to yourself");
  });

  it("returns 403 when sender is not verified", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ isVerified: false, isActive: true });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("verified");
  });

  it("returns 403 when sender account is suspended", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ isVerified: true, isActive: false });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("suspended");
  });

  it("returns 403 when sender has chat restriction", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ isVerified: true, isActive: true });
    prisma.userRestriction.findFirst.mockResolvedValue({
      type: "chat_restrict",
      expiresAt: null,
      reason: "Violation of guidelines",
    });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("restricted");
  });

  it("returns 403 when sender already has an active conversation with someone else", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockResolvedValue({ isVerified: true, isActive: true });
    prisma.userRestriction.findFirst.mockResolvedValue(null);
    prisma.message.findFirst.mockResolvedValue({ id: "existing-msg" });

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("only message one person");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/messages").send(payload);
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to send message");
  });
});

describe("GET /api/messages/conversation/:otherUserId", () => {
  it("returns conversation messages", async () => {
    const token = authedUser();
    prisma.message.findMany.mockResolvedValue([
      {
        id: "msg-1",
        senderId: "uuid-123",
        receiverId: "other-1",
        content: "Hello",
        createdAt: new Date(),
        isRead: true,
        sender: { id: "uuid-123", firstName: "John", lastName: "Doe" },
        receiver: { id: "other-1", firstName: "Jane", lastName: "Doe" },
      },
    ]);
    prisma.message.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .get("/api/messages/conversation/other-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe("Hello");
  });

  it("returns empty array when no messages exist", async () => {
    const token = authedUser();
    prisma.message.findMany.mockResolvedValue([]);
    prisma.message.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .get("/api/messages/conversation/other-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/messages/conversation/other-1");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.message.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/messages/conversation/other-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch conversation");
  });
});

describe("GET /api/messages/conversations", () => {
  it("returns grouped conversations with unread counts", async () => {
    const token = authedUser();
    prisma.message.findMany.mockResolvedValue([
      {
        id: "msg-1",
        senderId: "other-1",
        receiverId: "uuid-123",
        content: "Hey there",
        createdAt: new Date(),
        isRead: false,
        sender: { id: "other-1", firstName: "Jane", lastName: "Doe", profile: { photos: [] } },
        receiver: { id: "uuid-123", firstName: "John", lastName: "Doe", profile: { photos: [] } },
      },
      {
        id: "msg-2",
        senderId: "other-1",
        receiverId: "uuid-123",
        content: "Are you free?",
        createdAt: new Date(),
        isRead: false,
        sender: { id: "other-1", firstName: "Jane", lastName: "Doe", profile: { photos: [] } },
        receiver: { id: "uuid-123", firstName: "John", lastName: "Doe", profile: { photos: [] } },
      },
    ]);

    const res = await request(app)
      .get("/api/messages/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(1);
    expect(res.body.conversations[0].user.firstName).toBe("Jane");
    expect(res.body.conversations[0].unreadCount).toBe(2);
  });

  it("returns empty array with no conversations", async () => {
    const token = authedUser();
    prisma.message.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/messages/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toEqual([]);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/messages/conversations");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.message.findMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .get("/api/messages/conversations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to fetch conversations");
  });
});

describe("PUT /api/messages/:messageId/read", () => {
  it("marks a message as read", async () => {
    const token = authedUser();
    prisma.message.updateMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .put("/api/messages/msg-1/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Message marked as read");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).put("/api/messages/msg-1/read");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error", async () => {
    const token = authedUser();
    prisma.message.updateMany.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .put("/api/messages/msg-1/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to mark message as read");
  });
});

describe("DELETE /api/messages/:messageId", () => {
  it("deletes own message successfully", async () => {
    const token = authedUser();
    prisma.message.findUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "uuid-123",
    });
    prisma.message.delete.mockResolvedValue({ id: "msg-1" });

    const res = await request(app)
      .delete("/api/messages/msg-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Message deleted successfully");
  });

  it("returns 404 when message does not exist", async () => {
    const token = authedUser();
    prisma.message.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/messages/nonexistent")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Message not found");
  });

  it("returns 403 when not the sender", async () => {
    const token = authedUser();
    prisma.message.findUnique.mockResolvedValue({
      id: "msg-1",
      senderId: "other-user",
    });

    const res = await request(app)
      .delete("/api/messages/msg-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Not authorized to delete this message");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).delete("/api/messages/msg-1");
    expect(res.status).toBe(401);
  });

  it("returns 500 on database error during find", async () => {
    const token = authedUser();
    prisma.message.findUnique.mockRejectedValue(new Error("DB error"));

    const res = await request(app)
      .delete("/api/messages/msg-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to delete message");
  });
});

describe("POST /api/messages/block", () => {
  it("blocks a user successfully", async () => {
    const token = authedUser();

    const res = await request(app)
      .post("/api/messages/block")
      .set("Authorization", `Bearer ${token}`)
      .send({ blockedUserId: "other-1" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User blocked successfully");
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/messages/block")
      .send({ blockedUserId: "other-1" });
    expect(res.status).toBe(401);
  });
});
