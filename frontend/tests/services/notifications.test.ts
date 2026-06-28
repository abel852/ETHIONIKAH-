jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
import { notificationService } from "@/services/notifications";

const mockGet = api.get as jest.Mock;
const mockPut = api.put as jest.Mock;

describe("notificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAll calls correct endpoint", () => {
    notificationService.getAll();
    expect(mockGet).toHaveBeenCalledWith("/notifications");
  });

  it("markAsRead calls correct endpoint", () => {
    notificationService.markAsRead("notif-1");
    expect(mockPut).toHaveBeenCalledWith("/notifications/notif-1/read");
  });

  it("markAllAsRead calls correct endpoint", () => {
    notificationService.markAllAsRead();
    expect(mockPut).toHaveBeenCalledWith("/notifications/read-all");
  });

  it("getUnreadCount calls correct endpoint", () => {
    notificationService.getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith("/notifications/unread-count");
  });
});
