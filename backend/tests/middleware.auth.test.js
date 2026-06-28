const { authenticate, authorize } = require("../src/middleware/auth");

jest.mock("../src/config/auth", () => ({
  verifyAccessToken: jest.fn(),
}));
jest.mock("../src/config/database", () => ({
  user: { findUnique: jest.fn() },
}));

const { verifyAccessToken } = require("../src/config/auth");
const prisma = require("../src/config/database");

function mockReqRes(headers, user) {
  const req = { headers: headers || {}, user };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authenticate middleware", () => {
  it("returns 401 when no Authorization header is present", () => {
    const { req, res, next } = mockReqRes({});
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header has empty Bearer token", () => {
    const { req, res, next } = mockReqRes({ authorization: "Bearer " });
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header has a non-Bearer scheme", () => {
    verifyAccessToken.mockImplementation(() => { throw new Error("jwt malformed"); });
    const { req, res, next } = mockReqRes({ authorization: "Basic abc123" });
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid or expired", () => {
    verifyAccessToken.mockImplementation(() => { throw new Error("jwt malformed"); });
    const { req, res, next } = mockReqRes({ authorization: "Bearer invalid-token" });
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when token is valid and has no tokenVersion", () => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", role: "user" });
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual({ userId: "uuid-123", role: "user" });
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when user is not found in DB", (done) => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue(null);
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Account not found or inactive" });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it("returns 401 when user is inactive", (done) => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue({ id: "uuid-123", isActive: false, tokenVersion: 1 });
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Account not found or inactive" });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it("returns 401 when tokenVersion mismatches", (done) => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue({ id: "uuid-123", isActive: true, tokenVersion: 2 });
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Session invalidated. Please login again." });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it("calls next() when tokenVersion matches", (done) => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue({ id: "uuid-123", isActive: true, tokenVersion: 1 });
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    setImmediate(() => {
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      done();
    });
  });

  it("returns 500 when DB query fails", (done) => {
    verifyAccessToken.mockReturnValue({ userId: "uuid-123", tokenVersion: 1 });
    prisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    const { req, res, next } = mockReqRes({ authorization: "Bearer valid-token" });
    authenticate(req, res, next);
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Auth check failed" });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });
});

describe("authorize middleware", () => {
  it("returns 403 when no user on request", () => {
    const { req, res, next } = mockReqRes({}, null);
    authorize("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not in allowed roles", () => {
    const { req, res, next } = mockReqRes({}, { userId: "uuid-123", role: "user" });
    authorize("admin", "moderator")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Insufficient permissions" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when user role is in allowed roles", () => {
    const { req, res, next } = mockReqRes({}, { userId: "uuid-123", role: "admin" });
    authorize("admin", "moderator")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("calls next() when user role matches single allowed role", () => {
    const { req, res, next } = mockReqRes({}, { userId: "uuid-123", role: "moderator" });
    authorize("moderator")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
