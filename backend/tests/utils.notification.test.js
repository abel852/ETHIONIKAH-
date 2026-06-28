const { createNotification, notifyAllAdmins } = require("../src/utils/notification");

jest.mock("../src/config/database", () => ({
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
}));

const prisma = require("../src/config/database");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createNotification", () => {
  it("creates a notification with correct data", async () => {
    const notificationData = {
      userId: "uuid-123",
      type: "message",
      title: "New Message",
      body: "You have a new message from John",
    };
    prisma.notification.create.mockResolvedValue({ id: "notif-1", ...notificationData });

    const result = await createNotification(notificationData);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: notificationData,
    });
    expect(result).toEqual({ id: "notif-1", ...notificationData });
  });

  it("persists the correct data structure", async () => {
    const data = { userId: "uuid-456", type: "like", title: "New Like", body: "Someone liked your profile" };
    prisma.notification.create.mockResolvedValue({ id: "n1", ...data });

    await createNotification(data);

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: "uuid-456", type: "like", title: "New Like", body: "Someone liked your profile" },
    });
  });

  it("returns the created notification", async () => {
    const expected = { id: "notif-abc", userId: "u1", type: "admin", title: "Alert", body: "Test" };
    prisma.notification.create.mockResolvedValue(expected);

    const result = await createNotification({ userId: "u1", type: "admin", title: "Alert", body: "Test" });

    expect(result).toEqual(expected);
  });
});

describe("notifyAllAdmins", () => {
  it("finds admins and creates notifications for each", async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: "admin-1" },
      { id: "admin-2" },
      { id: "admin-3" },
    ]);
    prisma.notification.createMany.mockResolvedValue({ count: 3 });

    await notifyAllAdmins({
      type: "report",
      title: "New Report",
      body: "A new user report has been filed",
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { adminRole: { not: null } },
      select: { id: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "admin-1", type: "report", title: "New Report", body: "A new user report has been filed" },
        { userId: "admin-2", type: "report", title: "New Report", body: "A new user report has been filed" },
        { userId: "admin-3", type: "report", title: "New Report", body: "A new user report has been filed" },
      ],
    });
  });

  it("does nothing when no admins exist", async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await notifyAllAdmins({
      type: "report",
      title: "New Report",
      body: "Test",
    });

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it("handles a single admin", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "admin-1" }]);
    prisma.notification.createMany.mockResolvedValue({ count: 1 });

    await notifyAllAdmins({ type: "info", title: "Test", body: "Test body" });

    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [{ userId: "admin-1", type: "info", title: "Test", body: "Test body" }],
    });
  });
});
