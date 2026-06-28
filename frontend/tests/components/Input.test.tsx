import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import Input from "@/components/common/Input";

jest.mock("framer-motion", () => ({
  motion: {
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

describe("Input", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with label", () => {
    render(<Input label="Email" id="email" />);
    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", "email");
  });

  it("renders error message", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("shows icon when icon prop provided", () => {
    render(<Input icon={<span data-testid="input-icon" />} />);
    expect(screen.getByTestId("input-icon")).toBeInTheDocument();
  });

  it("forwards ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("applies error styling", () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("border-red-400");
  });

  it("applies icon padding when icon provided", () => {
    const { container } = render(<Input icon={<span />} />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("pl-11");
  });

  it("renders input with correct id", () => {
    render(<Input id="test-id" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "test-id");
  });
});
