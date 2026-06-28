import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => "",
  useInView: () => true,
}));

jest.mock("lucide-react", () => ({
  ChevronDown: (props: any) => <svg {...props} data-testid="icon-chevron-down" />,
  Shield: (props: any) => <svg {...props} data-testid="icon-shield" />,
  CheckCircle: (props: any) => <svg {...props} data-testid="icon-check-circle" />,
  Sparkles: (props: any) => <svg {...props} data-testid="icon-sparkles" />,
  Star: (props: any) => <svg {...props} data-testid="icon-star" />,
  ArrowRight: (props: any) => <svg {...props} data-testid="icon-arrow-right" />,
  UserCheck: (props: any) => <svg {...props} data-testid="icon-user-check" />,
  Heart: (props: any) => <svg {...props} data-testid="icon-heart" />,
  MessageCircle: (props: any) => <svg {...props} data-testid="icon-message-circle" />,
  Quote: (props: any) => <svg {...props} data-testid="icon-quote" />,
  ChevronLeft: (props: any) => <svg {...props} data-testid="icon-chevron-left" />,
  ChevronRight: (props: any) => <svg {...props} data-testid="icon-chevron-right" />,
  Award: (props: any) => <svg {...props} data-testid="icon-award" />,
  Gem: (props: any) => <svg {...props} data-testid="icon-gem" />,
  Fingerprint: (props: any) => <svg {...props} data-testid="icon-fingerprint" />,
  Users: (props: any) => <svg {...props} data-testid="icon-users" />,
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  return MockLink;
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("@/components/layout", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeInTheDocument();
  });

  it("renders Navbar", () => {
    render(<HomePage />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("renders Footer", () => {
    render(<HomePage />);
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders hero section with Begin Your Journey text", () => {
    render(<HomePage />);
    expect(screen.getByText("Begin Your Journey")).toBeInTheDocument();
  });

  it("renders hero section with Explore Matches text", () => {
    render(<HomePage />);
    expect(screen.getByText("Explore Matches")).toBeInTheDocument();
  });

  it("renders hero section verification features", () => {
    render(<HomePage />);
    expect(screen.getByText("Verified Profiles")).toBeInTheDocument();
    expect(screen.getByText("Privacy Protected")).toBeInTheDocument();
    expect(screen.getByText("Sharia Compliant")).toBeInTheDocument();
  });

  it("renders MatchPreviewSection with profile names", () => {
    render(<HomePage />);
    expect(screen.getByText("Aisha M.")).toBeInTheDocument();
    expect(screen.getByText("Fatima A.")).toBeInTheDocument();
    expect(screen.getByText("Zainab H.")).toBeInTheDocument();
    expect(screen.getByText("Khadija O.")).toBeInTheDocument();
  });

  it("renders TrustSection with trust items", () => {
    render(<HomePage />);
    expect(screen.getByText("Identity Verified")).toBeInTheDocument();
    expect(screen.getByText("Privacy First")).toBeInTheDocument();
    expect(screen.getByText("Islamically Compliant")).toBeInTheDocument();
    expect(screen.getByText("Family Inclusive")).toBeInTheDocument();
  });

  it("renders JourneySection with steps", () => {
    render(<HomePage />);
    expect(screen.getAllByText("Create Profile").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Get Verified").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Find Compatible Matches").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Respectful Communication").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Family Engagement").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Blessed Marriage").length).toBeGreaterThanOrEqual(1);
  });

  it("renders StoriesSection with story names", () => {
    render(<HomePage />);
    expect(screen.getByText("Aisha & Ibrahim")).toBeInTheDocument();
    expect(screen.getByText("Blessed Unions")).toBeInTheDocument();
  });

  it("renders CTASection with Create Free Account button", () => {
    render(<HomePage />);
    expect(screen.getByText("Create Free Account")).toBeInTheDocument();
  });

  it("renders View All Matches link in MatchPreviewSection", () => {
    render(<HomePage />);
    expect(screen.getByText("View All Matches")).toBeInTheDocument();
  });
});
