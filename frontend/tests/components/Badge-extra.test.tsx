import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Badge, VerifiedBadge, NotVerifiedBadge } from "@/components/common/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant by default", () => {
    const { container } = render(<Badge>Default</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-charcoal-100");
  });

  it("applies gold variant", () => {
    const { container } = render(<Badge variant="gold">Gold</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("text-accent-dark");
  });

  it("applies success variant", () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-green-100");
  });

  it("applies warning variant", () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-yellow-100");
  });

  it("applies danger variant", () => {
    const { container } = render(<Badge variant="danger">Danger</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-red-100");
  });

  it("applies sm size by default", () => {
    const { container } = render(<Badge>Small</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("px-2");
  });

  it("applies md size", () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const span = container.querySelector("span");
    expect(span).toHaveClass("px-3");
  });

  it("applies custom className", () => {
    const { container } = render(<Badge className="custom">Custom</Badge>);
    expect(container.querySelector("span")).toHaveClass("custom");
  });

  it("renders rounded-full", () => {
    const { container } = render(<Badge>Rounded</Badge>);
    expect(container.querySelector("span")).toHaveClass("rounded-full");
  });
});

describe("VerifiedBadge", () => {
  it("renders Verified text", () => {
    render(<VerifiedBadge />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("renders svg icon", () => {
    const { container } = render(<VerifiedBadge />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies gradient classes", () => {
    const { container } = render(<VerifiedBadge />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-gradient-to-r");
  });

  it("applies custom className", () => {
    const { container } = render(<VerifiedBadge className="extra" />);
    expect(container.querySelector("span")).toHaveClass("extra");
  });
});

describe("NotVerifiedBadge", () => {
  it("renders Not Verified text", () => {
    render(<NotVerifiedBadge />);
    expect(screen.getByText("Not Verified")).toBeInTheDocument();
  });

  it("renders svg icon", () => {
    const { container } = render(<NotVerifiedBadge />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<NotVerifiedBadge className="extra" />);
    expect(container.querySelector("span")).toHaveClass("extra");
  });
});
