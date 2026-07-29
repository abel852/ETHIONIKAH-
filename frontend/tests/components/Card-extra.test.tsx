import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardContent } from "@/components/common/Card";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileInView, whileHover, initial, animate, exit, transition, viewport, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies rounded-2xl class", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass("rounded-2xl");
  });

  it("applies default padding md (p-6)", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass("p-6");
  });

  it("applies sm padding (p-4)", () => {
    const { container } = render(<Card padding="sm">Test</Card>);
    expect(container.firstChild).toHaveClass("p-4");
  });

  it("applies lg padding (p-8)", () => {
    const { container } = render(<Card padding="lg">Test</Card>);
    expect(container.firstChild).toHaveClass("p-8");
  });

  it("applies no padding when padding is none", () => {
    const { container } = render(<Card padding="none">Test</Card>);
    expect(container.firstChild).not.toHaveClass("p-6");
  });

  it("applies glass styling when glass is true", () => {
    const { container } = render(<Card glass>Test</Card>);
    expect(container.firstChild).toHaveClass("backdrop-blur-xl");
  });

  it("applies non-glass styling by default", () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="my-card">Test</Card>);
    expect(container.firstChild).toHaveClass("my-card");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader><span>Header</span></CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("applies flex and justify-between classes", () => {
    const { container } = render(<CardHeader><span>H</span></CardHeader>);
    expect(container.firstChild).toHaveClass("flex");
    expect(container.firstChild).toHaveClass("justify-between");
  });

  it("applies custom className", () => {
    const { container } = render(<CardHeader className="custom"><span>H</span></CardHeader>);
    expect(container.firstChild).toHaveClass("custom");
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent><span>Content</span></CardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<CardContent className="my-content"><span>C</span></CardContent>);
    expect(container.firstChild).toHaveClass("my-content");
  });
});
