import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationBell from "@/components/notifications/NotificationBell";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock("lucide-react", () => ({
  Bell: () => <svg data-testid="icon-bell" />,
  Check: () => <svg data-testid="icon-check" />,
  X: () => <svg data-testid="icon-x" />,
}));

jest.mock("next/link", () => ({ children, href, onClick, ...props }: any) => (
  <a href={href} onClick={onClick} {...props}>{children}</a>
));

jest.mock("@/store/notifications", () => ({
  useNotificationStore: jest.fn(() => ({
    notifications: [],
    unreadCount: 0,
    fetchNotifications: jest.fn(),
    fetchUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  })),
}));

jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 days ago",
}));

describe("NotificationBell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders bell icon", () => {
    render(<NotificationBell />);
    expect(screen.getByTestId("icon-bell")).toBeInTheDocument();
  });

  it("does not show unread badge when count is 0", () => {
    render(<NotificationBell />);
    const badge = screen.queryByText("0");
    expect(badge).not.toBeInTheDocument();
  });

  it("shows unread count badge when count > 0", () => {
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: [],
      unreadCount: 3,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows '9+' when unread count > 9", () => {
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: [],
      unreadCount: 15,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<NotificationBell />);
    const button = screen.getByLabelText("Notifications");
    fireEvent.click(button);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("shows 'No notifications yet' when empty and opened", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("renders notification items when present", () => {
    const mockNotifs = [
      { id: "1", type: "match", title: "New Match", body: "You have a new match", createdAt: new Date().toISOString(), read: false },
      { id: "2", type: "message", title: "New Message", body: "Someone messaged you", createdAt: new Date().toISOString(), read: true },
    ];
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: mockNotifs,
      unreadCount: 1,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("New Match")).toBeInTheDocument();
    expect(screen.getByText("New Message")).toBeInTheDocument();
  });

  it("shows 'View all notifications' link when there are notifications", () => {
    const mockNotifs = [
      { id: "1", type: "match", title: "Test", body: "Body", createdAt: new Date().toISOString(), read: false },
    ];
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: mockNotifs,
      unreadCount: 1,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("View all notifications")).toBeInTheDocument();
  });

  it("shows Mark all read button when there are unread notifications", () => {
    const mockNotifs = [
      { id: "1", type: "match", title: "Test", body: "Body", createdAt: new Date().toISOString(), read: false },
    ];
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: mockNotifs,
      unreadCount: 1,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("Mark all read")).toBeInTheDocument();
  });

  it("does not show Mark all read when all notifications are read", () => {
    const mockNotifs = [
      { id: "1", type: "match", title: "Test", body: "Body", createdAt: new Date().toISOString(), read: true },
    ];
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: mockNotifs,
      unreadCount: 0,
      fetchNotifications: jest.fn(),
      fetchUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    fireEvent.click(screen.getByLabelText("Notifications"));
    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("calls fetchUnreadCount on mount", () => {
    const fetchUnreadCount = jest.fn();
    require("@/store/notifications").useNotificationStore.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      fetchNotifications: jest.fn(),
      fetchUnreadCount,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    });
    render(<NotificationBell />);
    expect(fetchUnreadCount).toHaveBeenCalled();
  });
});
