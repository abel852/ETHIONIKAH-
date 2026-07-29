import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/common/Avatar";

jest.mock("lucide-react", () => ({
  Crown: () => <svg data-testid="icon-crown" />,
  Gem: () => <svg data-testid="icon-gem" />,
  ShieldCheck: () => <svg data-testid="icon-shield-check" />,
}));

describe("Avatar", () => {
  it("renders initials when no src", () => {
    render(<Avatar firstName="John" lastName="Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders image when src provided", () => {
    render(<Avatar src="/photo.jpg" firstName="John" lastName="Doe" />);
    const img = screen.getByAltText("John Doe");
    expect(img).toHaveAttribute("src", "/photo.jpg");
  });

  it("applies sm size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="sm" />);
    const div = container.querySelector(".rounded-full");
    expect(div).toHaveClass("w-8");
  });

  it("applies lg size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="lg" />);
    const div = container.querySelector(".rounded-full");
    expect(div).toHaveClass("w-14");
  });

  it("applies xl size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="xl" />);
    const div = container.querySelector(".rounded-full");
    expect(div).toHaveClass("w-20");
  });

  it("shows crown for gold membership", () => {
    render(<Avatar firstName="John" lastName="Doe" membershipPlan="gold" />);
    expect(screen.getByTestId("icon-crown")).toBeInTheDocument();
  });

  it("shows gem for platinum membership", () => {
    render(<Avatar firstName="John" lastName="Doe" membershipPlan="platinum" />);
    expect(screen.getByTestId("icon-gem")).toBeInTheDocument();
  });

  it("hides membership badge when showMembershipBadge is false", () => {
    render(<Avatar firstName="John" lastName="Doe" membershipPlan="gold" showMembershipBadge={false} />);
    expect(screen.queryByTestId("icon-crown")).not.toBeInTheDocument();
  });

  it("shows verified badge when isVerified", () => {
    render(<Avatar firstName="John" lastName="Doe" isVerified />);
    expect(screen.getByTestId("icon-shield-check")).toBeInTheDocument();
  });

  it("does not show verified badge when not verified", () => {
    render(<Avatar firstName="John" lastName="Doe" />);
    expect(screen.queryByTestId("icon-shield-check")).not.toBeInTheDocument();
  });

  it("shows online status indicator", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="online" />);
    const statusDot = container.querySelector(".bg-green-500");
    expect(statusDot).toBeInTheDocument();
  });

  it("shows offline status indicator", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="offline" />);
    const statusDot = container.querySelector(".bg-charcoal-300");
    expect(statusDot).toBeInTheDocument();
  });

  it("shows away status indicator", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="away" />);
    const statusDot = container.querySelector(".bg-yellow-500");
    expect(statusDot).toBeInTheDocument();
  });

  it("does not show status indicator when not provided", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" />);
    expect(container.querySelector(".bg-green-500")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
