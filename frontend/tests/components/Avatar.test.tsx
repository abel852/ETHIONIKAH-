import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/common/Avatar";

describe("Avatar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows image when src provided", () => {
    render(<Avatar src="/photo.jpg" firstName="John" lastName="Doe" />);
    const img = screen.getByAltText("John Doe");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/photo.jpg");
  });

  it("shows initials when no src", () => {
    render(<Avatar firstName="John" lastName="Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows status indicator when status provided", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="online" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("bg-green-500");
  });

  it("shows offline status indicator", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="offline" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).toHaveClass("bg-charcoal-300");
  });

  it("shows away status indicator", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" status="away" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).toHaveClass("bg-yellow-500");
  });

  it("does not show status indicator when status is not provided", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).not.toBeInTheDocument();
  });

  it("applies sm size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="sm" />);
    const el = container.firstChild?.firstChild as HTMLElement;
    expect(el).toHaveClass("w-8 h-8");
  });

  it("applies md size classes by default", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" />);
    const el = container.firstChild?.firstChild as HTMLElement;
    expect(el).toHaveClass("w-10 h-10");
  });

  it("applies lg size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="lg" />);
    const el = container.firstChild?.firstChild as HTMLElement;
    expect(el).toHaveClass("w-14 h-14");
  });

  it("applies xl size classes", () => {
    const { container } = render(<Avatar firstName="John" lastName="Doe" size="xl" />);
    const el = container.firstChild?.firstChild as HTMLElement;
    expect(el).toHaveClass("w-20 h-20");
  });

  it("renders initials as uppercase", () => {
    render(<Avatar firstName="john" lastName="doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});
