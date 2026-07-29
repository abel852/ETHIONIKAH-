import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import Input from "@/components/common/Input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<Input placeholder="Test" />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("renders error message when error is provided", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("does not render error message when no error", () => {
    const { container } = render(<Input placeholder="Test" />);
    expect(container.querySelector(".text-red-500")).not.toBeInTheDocument();
  });

  it("applies error border class when error is present", () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("border-red-400");
  });

  it("renders icon when provided", () => {
    render(<Input icon={<span data-testid="test-icon" />} placeholder="Test" />);
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies left padding when icon is present", () => {
    const { container } = render(<Input icon={<span />} placeholder="Test" />);
    const input = container.querySelector("input");
    expect(input).toHaveClass("pl-11");
  });

  it("does not apply left padding when no icon", () => {
    const { container } = render(<Input placeholder="Test" />);
    const input = container.querySelector("input");
    expect(input).not.toHaveClass("pl-11");
  });

  it("accepts and displays typed value", () => {
    const { container } = render(<Input placeholder="Test" />);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input).toHaveValue("hello");
  });

  it("forwards ref to input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Test" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("applies custom className", () => {
    const { container } = render(<Input className="my-input" placeholder="Test" />);
    expect(container.querySelector("input")).toHaveClass("my-input");
  });

  it("passes through type attribute", () => {
    const { container } = render(<Input type="password" placeholder="Test" />);
    expect(container.querySelector("input")).toHaveAttribute("type", "password");
  });

  it("passes through disabled attribute", () => {
    const { container } = render(<Input disabled placeholder="Test" />);
    expect(container.querySelector("input")).toBeDisabled();
  });
});
