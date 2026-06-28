import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("lucide-react", () => ({
  User: () => <svg data-testid="icon-user" />,
  Heart: () => <svg data-testid="icon-heart" />,
  MessageCircle: () => <svg data-testid="icon-message" />,
  Settings: () => <svg data-testid="icon-settings" />,
  LogOut: () => <svg data-testid="icon-logout" />,
}));

jest.mock("next/link", () => ({ children, href, onClick, ...props }: any) => (
  <a href={href} onClick={onClick} {...props}>{children}</a>
));

jest.mock("next/image", () => ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />);

const mockPush = jest.fn();
const mockLogout = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/matches",
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => ({ user: null, logout: mockLogout })),
}));

jest.mock("@/components/common", () => ({
  Avatar: ({ firstName, lastName }: any) => <div data-testid="avatar">{firstName} {lastName}</div>,
  VerifiedBadge: () => <span data-testid="verified-badge">Verified</span>,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
  mediaUrl: (url: any) => url || "",
}));

jest.mock("@/components/common/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

jest.mock("@/components/notifications/NotificationBell", () => ({
  __esModule: true,
  default: () => <div data-testid="notification-bell" />,
}));

describe("DashboardSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders mobile top bar with logo", () => {
    render(<DashboardSidebar />);
    const logo = screen.getAllByText("Ethio Nikah");
    expect(logo.length).toBeGreaterThanOrEqual(1);
  });

  it("renders notification bell in mobile and desktop", () => {
    render(<DashboardSidebar />);
    const bells = screen.getAllByTestId("notification-bell");
    expect(bells.length).toBe(2);
  });

  it("renders navigation items", () => {
    render(<DashboardSidebar />);
    expect(screen.getAllByText("Matches").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Profile").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Messages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Logout button", () => {
    render(<DashboardSidebar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders theme toggle", () => {
    render(<DashboardSidebar />);
    const toggles = screen.getAllByTestId("theme-toggle");
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });

  it("clicking Logout calls logout and router.push('/')", () => {
    render(<DashboardSidebar />);
    const logoutBtn = screen.getByText("Logout");
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows Locked badge for verification-required items when unverified", () => {
    render(<DashboardSidebar />);
    const lockedTags = screen.getAllByText("Locked");
    expect(lockedTags.length).toBeGreaterThanOrEqual(1);
  });
});
