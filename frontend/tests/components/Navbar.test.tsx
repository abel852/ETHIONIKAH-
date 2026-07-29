import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/layout/Navbar";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileTap, whileHover, transition, initial, animate, exit, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, whileTap, whileHover, transition, initial, animate, exit, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock("lucide-react", () => ({
  User: () => <svg data-testid="icon-user" />,
  LogOut: () => <svg data-testid="icon-logout" />,
}));

jest.mock("next/link", () => ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>);

jest.mock("next/image", () => ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />);

jest.mock("@/components/notifications/NotificationBell", () => ({
  __esModule: true,
  default: () => <div data-testid="notification-bell" />,
}));

jest.mock("@/context/I18nContext", () => ({
  useI18n: () => ({ t: (key: string) => {
    const map: Record<string, string> = {
      "nav.home": "Home",
      "nav.matches": "Matches",
      "nav.signIn": "Sign In",
      "nav.getStarted": "Get Started",
      "nav.profile": "Profile",
      "nav.logout": "Logout",
      "nav.openMenu": "Open menu",
      "nav.closeMenu": "Close menu",
      "app.name": "Ethio Nikah",
      "app.tagline": "Tagline",
    };
    return map[key] || key;
  }, lang: "en", setLang: jest.fn() }),
  Lang: String,
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: typeof localStorage !== "undefined" && localStorage.getItem("accessToken") ? { name: "Test" } : null,
    isAuthenticated: typeof localStorage !== "undefined" && !!localStorage.getItem("accessToken"),
    logout: jest.fn(),
  }),
}));

const mockLocalStorage = () => {
  let store: Record<string, string> = {};
  jest.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => store[key] ?? null);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => { store[key] = value; });
  jest.spyOn(Storage.prototype, "removeItem").mockImplementation((key: string) => { delete store[key]; });
  return store;
};

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage();
  });

  it("renders nav links (Home, Matches)", () => {
    render(<Navbar />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Matches")).toBeInTheDocument();
  });

  it("shows Sign In and Get Started when not authenticated", () => {
    render(<Navbar />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("shows Profile and Logout when authenticated", () => {
    localStorage.setItem("accessToken", "test-token");
    render(<Navbar />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("does not show Sign In when authenticated", () => {
    localStorage.setItem("accessToken", "test-token");
    render(<Navbar />);
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
  });

  it("toggles mobile menu on hamburger click", () => {
    render(<Navbar />);
    const menuButton = screen.getByLabelText("Open menu");
    fireEvent.click(menuButton);
    const menuButtons = screen.getAllByText("Sign In");
    expect(menuButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("has a link to the homepage with the logo", () => {
    render(<Navbar />);
    const homeLink = screen.getAllByText(/Ethio/)[0];
    expect(homeLink).toBeInTheDocument();
  });

  it("renders notification bell when authenticated", () => {
    localStorage.setItem("accessToken", "test-token");
    render(<Navbar />);
    expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
  });
});
