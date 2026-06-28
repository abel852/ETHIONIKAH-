import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardContent } from "@/components/common/Card";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileInView, initial, viewport, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children", () => {
    render(<Card><p data-testid="child">Content</p></Card>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies glass class when glass=true", () => {
    const { container } = render(<Card glass>Glass Card</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("backdrop-blur-xl");
    expect(div.className).toContain("bg-white/70");
  });

  it("does not apply glass classes when glass=false", () => {
    const { container } = render(<Card>Regular Card</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain("backdrop-blur-xl");
  });

  it("renders CardHeader correctly", () => {
    render(<CardHeader><h2 data-testid="header">Title</h2></CardHeader>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders CardContent correctly", () => {
    render(<CardContent><p data-testid="content">Body</p></CardContent>);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
