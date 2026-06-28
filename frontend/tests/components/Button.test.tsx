import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import Button from "@/components/common/Button";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("Button", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies primary variant class by default", () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("gold-gradient");
  });

  it("applies secondary variant classes", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("bg-white");
  });

  it("applies ghost variant classes", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("text-charcoal-600");
  });

  it("applies outline variant classes", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("border-accent");
  });

  it("applies danger variant classes", () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("bg-red-500");
  });

  it("applies sm size classes", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("px-4 py-2 text-sm");
  });

  it("applies md size classes by default", () => {
    const { container } = render(<Button>Medium</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("px-6 py-3");
  });

  it("applies lg size classes", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("px-8 py-4");
  });

  it("applies xl size classes", () => {
    const { container } = render(<Button size="xl">XLarge</Button>);
    const btn = container.querySelector("button");
    expect(btn).toHaveClass("px-10 py-5");
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Loading</Button>);
    const svg = document.querySelector("svg.animate-spin");
    expect(svg).toBeInTheDocument();
  });

  it("shows icon when icon prop provided", () => {
    render(<Button icon={<span data-testid="test-icon" />}>With Icon</Button>);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("button is disabled when loading", () => {
    const { container } = render(<Button loading>Loading</Button>);
    const btn = container.querySelector("button");
    expect(btn).toBeDisabled();
  });

  it("button is disabled when disabled prop is set", () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const btn = container.querySelector("button");
    expect(btn).toBeDisabled();
  });

  it("forwards ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Ref");
  });
});
