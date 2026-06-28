import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Badge, VerifiedBadge } from "@/components/common/Badge";

describe("Badge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children", () => {
    render(<Badge>Premium</Badge>);
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Badge>Default</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-charcoal-100");
  });

  it("applies gold variant classes", () => {
    const { container } = render(<Badge variant="gold">Gold</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-accent/15");
  });

  it("applies success variant classes", () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-green-100");
  });

  it("applies warning variant classes", () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-yellow-100");
  });

  it("applies danger variant classes", () => {
    const { container } = render(<Badge variant="danger">Danger</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("bg-red-100");
  });

  it("applies sm size classes by default", () => {
    const { container } = render(<Badge>Small</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("px-2 py-0.5 text-xs");
  });

  it("applies md size classes", () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("px-3 py-1 text-sm");
  });

  it("VerifiedBadge renders with Verified text", () => {
    render(<VerifiedBadge />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("VerifiedBadge renders with an SVG icon", () => {
    const { container } = render(<VerifiedBadge />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
