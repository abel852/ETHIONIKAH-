import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "@/components/common/AnimatedCounter";

jest.mock("framer-motion", () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  useInView: () => true,
}));

jest.useFakeTimers();
jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: any) => {
  setTimeout(() => cb(performance.now() + 10000), 50);
  return 1;
});

describe("AnimatedCounter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders prefix text", () => {
    const { container } = render(<AnimatedCounter end={500} prefix="$" />);
    expect(container.textContent).toContain("$");
  });

  it("renders suffix text", () => {
    const { container } = render(<AnimatedCounter end={99} suffix="%" />);
    expect(container.textContent).toContain("%");
  });

  it("renders both prefix and suffix", () => {
    const { container } = render(<AnimatedCounter end={42} prefix="~" suffix=" users" />);
    expect(container.textContent).toContain("~");
    expect(container.textContent).toContain(" users");
  });

  it("renders initial count of 0", () => {
    render(<AnimatedCounter end={1000} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders 0 for zero end value", () => {
    render(<AnimatedCounter end={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("applies className", () => {
    const { container } = render(<AnimatedCounter end={10} className="text-lg font-bold" />);
    const el = container.querySelector("span");
    expect(el).toHaveClass("text-lg font-bold");
  });
});
