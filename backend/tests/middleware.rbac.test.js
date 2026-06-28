jest.mock("@prisma/client", () => {
  const mockAdminPerm = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      adminPermission: mockAdminPerm,
    })),
    __mockAdminPermission: mockAdminPerm,
  };
});

const { PERMISSIONS, requirePermission, getPermissionsForAdmin } = require("../src/middleware/rbac");
const { __mockAdminPermission } = require("@prisma/client");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PERMISSIONS object", () => {
  it("contains all expected permission categories", () => {
    expect(PERMISSIONS["users.view"]).toBeDefined();
    expect(PERMISSIONS["users.edit"]).toBeDefined();
    expect(PERMISSIONS["users.suspend"]).toBeDefined();
    expect(PERMISSIONS["content.review"]).toBeDefined();
    expect(PERMISSIONS["verifications.approve"]).toBeDefined();
    expect(PERMISSIONS["reports.view"]).toBeDefined();
    expect(PERMISSIONS["analytics.view"]).toBeDefined();
    expect(PERMISSIONS["settings.view"]).toBeDefined();
    expect(PERMISSIONS["security.audit_logs"]).toBeDefined();
  });

  it("has string descriptions for all permissions", () => {
    Object.entries(PERMISSIONS).forEach(([key, desc]) => {
      expect(typeof key).toBe("string");
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(0);
    });
  });
});

describe("requirePermission", () => {
  function mockReqRes(user) {
    const req = { user };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it("returns 403 when user is not admin", async () => {
    const { req, res, next } = mockReqRes({ id: "uuid-123", role: "user" });
    const middleware = await requirePermission("users.view");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() when admin has the required permission", async () => {
    __mockAdminPermission.findUnique.mockResolvedValue({ adminId: "admin-123", permission: "users.view" });
    const { req, res, next } = mockReqRes({ id: "admin-123", role: "admin" });
    const middleware = await requirePermission("users.view");

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when admin does not have the required permission", async () => {
    __mockAdminPermission.findUnique.mockResolvedValue(null);
    const { req, res, next } = mockReqRes({ id: "admin-123", role: "admin" });
    const middleware = await requirePermission("users.delete");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing permission: users.delete" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 when database query fails", async () => {
    __mockAdminPermission.findUnique.mockRejectedValue(new Error("DB error"));
    const { req, res, next } = mockReqRes({ id: "admin-123", role: "admin" });
    const middleware = await requirePermission("users.view");

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Permission check failed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns different middleware instances for different permissions", async () => {
    const m1 = await requirePermission("users.view");
    const m2 = await requirePermission("users.edit");
    expect(m1).not.toBe(m2);
  });
});

describe("getPermissionsForAdmin", () => {
  it("returns list of permission strings for a given admin", async () => {
    __mockAdminPermission.findMany.mockResolvedValue([
      { permission: "users.view" },
      { permission: "users.edit" },
      { permission: "analytics.view" },
    ]);

    const perms = await getPermissionsForAdmin("admin-123");

    expect(perms).toEqual(["users.view", "users.edit", "analytics.view"]);
  });

  it("returns empty array when admin has no permissions", async () => {
    __mockAdminPermission.findMany.mockResolvedValue([]);

    const perms = await getPermissionsForAdmin("admin-456");

    expect(perms).toEqual([]);
  });

  it("throws on database error", async () => {
    __mockAdminPermission.findMany.mockRejectedValue(new Error("DB error"));

    await expect(getPermissionsForAdmin("admin-123")).rejects.toThrow("DB error");
  });
});
