let mockAuditLogCreate;

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => {
    mockAuditLogCreate = jest.fn();
    return {
      auditLog: { create: mockAuditLogCreate },
    };
  }),
}));

const { logAudit } = require("../src/utils/auditLogger");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("logAudit", () => {
  it("creates an audit log entry with all fields", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit-1" });

    await logAudit({
      adminId: "admin-uuid",
      action: "DELETE_USER",
      resource: "user",
      resourceId: "user-uuid",
      details: { reason: "Violation of terms" },
      ipAddress: "192.168.1.1",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        adminId: "admin-uuid",
        action: "DELETE_USER",
        resource: "user",
        resourceId: "user-uuid",
        details: { reason: "Violation of terms" },
        ipAddress: "192.168.1.1",
      },
    });
  });

  it("defaults details to empty object when not provided", async () => {
    mockAuditLogCreate.mockResolvedValue({ id: "audit-2" });

    await logAudit({
      adminId: "admin-uuid",
      action: "LOGIN",
      resource: "session",
      ipAddress: "10.0.0.1",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: {
        adminId: "admin-uuid",
        action: "LOGIN",
        resource: "session",
        resourceId: undefined,
        details: {},
        ipAddress: "10.0.0.1",
      },
    });
  });

  it("handles database error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockAuditLogCreate.mockRejectedValue(new Error("Connection lost"));

    await logAudit({
      adminId: "admin-1",
      action: "UPDATE",
      resource: "profile",
    });

    expect(consoleSpy).toHaveBeenCalledWith("Audit log error:", "Connection lost");
    consoleSpy.mockRestore();
  });

  it("does not throw when database fails", async () => {
    mockAuditLogCreate.mockRejectedValue(new Error("DB error"));

    await expect(
      logAudit({ adminId: "admin-1", action: "READ", resource: "report" })
    ).resolves.toBeUndefined();
  });
});
