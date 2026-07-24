import { useNotificationStore } from "@/store/notifications";
import type { Notification } from "@/types";
import { act } from "@testing-library/react";

const mockNotification = (id: string, read: boolean): Notification => ({
  id,
  userId: "user-1",
  type: "message",
  title: "Test",
  body: "Test notification",
  read,
  createdAt: new Date().toISOString(),
});

const mockGetAll = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();

jest.mock("@/services/notifications", () => ({
  notificationService: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
    markAsRead: (...args: any[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
  },
}));

describe("notificationStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
    });
  });

  it("fetchNotifications loads notifications and calculates unread count", async () => {
    const mockNotifs = [
      mockNotification("n1", false),
      mockNotification("n2", true),
      mockNotification("n3", false),
    ];
    mockGetAll.mockResolvedValue({ data: { notifications: mockNotifs } });

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications();
    });

    expect(mockGetAll).toHaveBeenCalled();
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual(mockNotifs);
    expect(state.unreadCount).toBe(2);
    expect(state.isLoading).toBe(false);
  });

  it("fetchNotifications handles direct array response", async () => {
    const mockNotifs = [mockNotification("n1", false)];
    mockGetAll.mockResolvedValue({ data: mockNotifs });

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications();
    });

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual(mockNotifs);
    expect(state.unreadCount).toBe(1);
  });

  it("fetchNotifications handles errors gracefully", async () => {
    mockGetAll.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useNotificationStore.getState().fetchNotifications();
    });

    const state = useNotificationStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.notifications).toEqual([]);
  });

  it("fetchUnreadCount loads just the count", async () => {
    mockGetUnreadCount.mockResolvedValue({ data: { count: 5 } });

    await act(async () => {
      await useNotificationStore.getState().fetchUnreadCount();
    });

    expect(mockGetUnreadCount).toHaveBeenCalled();
    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it("fetchUnreadCount handles errors gracefully", async () => {
    mockGetUnreadCount.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useNotificationStore.getState().fetchUnreadCount();
    });

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("markAsRead marks a notification as read and decrements count", async () => {
    useNotificationStore.setState({
      notifications: [
        mockNotification("n1", false),
        mockNotification("n2", false),
      ],
      unreadCount: 2,
    });
    mockMarkAsRead.mockResolvedValue({});

    await act(async () => {
      await useNotificationStore.getState().markAsRead("n1");
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith("n1");
    const state = useNotificationStore.getState();
    expect(state.notifications.find((n: any) => n.id === "n1")?.read).toBe(true);
    expect(state.notifications.find((n: any) => n.id === "n2")?.read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("markAsRead handles errors gracefully", async () => {
    useNotificationStore.setState({
      notifications: [mockNotification("n1", false)],
      unreadCount: 1,
    });
    mockMarkAsRead.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useNotificationStore.getState().markAsRead("n1");
    });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("markAllAsRead marks all as read", async () => {
    useNotificationStore.setState({
      notifications: [
        mockNotification("n1", false),
        mockNotification("n2", false),
      ],
      unreadCount: 2,
    });
    mockMarkAllAsRead.mockResolvedValue({});

    await act(async () => {
      await useNotificationStore.getState().markAllAsRead();
    });

    expect(mockMarkAllAsRead).toHaveBeenCalled();
    const state = useNotificationStore.getState();
    expect(state.notifications.every((n: any) => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("markAllAsRead handles errors gracefully", async () => {
    useNotificationStore.setState({
      notifications: [mockNotification("n1", false)],
      unreadCount: 1,
    });
    mockMarkAllAsRead.mockRejectedValue(new Error("Error"));

    await act(async () => {
      await useNotificationStore.getState().markAllAsRead();
    });

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
  });
});
