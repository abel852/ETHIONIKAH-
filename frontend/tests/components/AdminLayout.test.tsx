import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminLayout from "@/components/admin/AdminLayout";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("lucide-react", () => ({
  LayoutDashboard: () => <svg data-testid="icon-dashboard" />,
  Users: () => <svg data-testid="icon-users" />,
  Shield: () => <svg data-testid="icon-shield" />,
  Settings: () => <svg data-testid="icon-settings" />,
  Activity: () => <svg data-testid="icon-activity" />,
  LogOut: () => <svg data-testid="icon-logout" />,
  Sun: () => <svg data-testid="icon-sun" />,
  Moon: () => <svg data-testid="icon-moon" />,
  ChevronDown: () => <svg data-testid="icon-chevron-down" />,
  FileText: () => <svg data-testid="icon-filetext" />,
  CreditCard: () => <svg data-testid="icon-creditcard" />,
  BarChart3: () => <svg data-testid="icon-barchart" />,
  ShieldAlert: () => <svg data-testid="icon-shieldalert" />,
  Sliders: () => <svg data-testid="icon-sliders" />,
  Puzzle: () => <svg data-testid="icon-puzzle" />,
  Bot: () => <svg data-testid="icon-bot" />,
  Globe: () => <svg data-testid="icon-globe" />,
  HeartHandshake: () => <svg data-testid="icon-handshake" />,
  UserCheck: () => <svg data-testid="icon-usercheck" />,
  Flag: () => <svg data-testid="icon-flag" />,
  Scale: () => <svg data-testid="icon-scale" />,
  Bell: () => <svg data-testid="icon-bell" />,
  Menu: () => <svg data-testid="icon-menu" />,
}));

jest.mock("next/link", () => ({ children, href, onClick, ...props }: any) => (
  <a href={href} onClick={onClick} {...props}>{children}</a>
));

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    user: { firstName: "Admin", lastName: "User", role: "admin" },
    logout: jest.fn(),
  })),
}));

jest.mock("@/components/notifications/NotificationBell", () => ({
  __esModule: true,
  default: () => <div data-testid="notification-bell" />,
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children content", () => {
    render(<AdminLayout><div data-testid="child">Content</div></AdminLayout>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders sidebar navigation sections", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getAllByText("Security").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("renders nav items under sections", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Payments").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Analytics").length).toBeGreaterThanOrEqual(1);
  });

  it("renders brand and ADMIN badge", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("renders notification bell", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });

  it("renders dark mode toggle in sidebar", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<AdminLayout><div /></AdminLayout>);
    const logoutButtons = screen.getAllByTestId("icon-logout");
    expect(logoutButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders user name from auth context", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("shows mobile menu button on small screens", () => {
    render(<AdminLayout><div /></AdminLayout>);
    expect(screen.getByTestId("icon-menu")).toBeInTheDocument();
  });
});
