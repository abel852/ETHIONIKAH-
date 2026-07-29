import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import Textarea from "@/components/common/Textarea";

describe("Textarea", () => {
  it("renders textarea element", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Textarea label="Bio" id="bio" />);
    expect(screen.getByText("Bio")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<Textarea placeholder="Test" />);
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("renders error message when error is provided", () => {
    render(<Textarea error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("does not render error when not provided", () => {
    const { container } = render(<Textarea placeholder="Test" />);
    expect(container.querySelector(".text-red-500")).not.toBeInTheDocument();
  });

  it("applies error border class when error is present", () => {
    const { container } = render(<Textarea error="Error" />);
    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("border-red-400");
  });

  it("applies resize-none class", () => {
    const { container } = render(<Textarea placeholder="Test" />);
    expect(container.querySelector("textarea")).toHaveClass("resize-none");
  });

  it("accepts and displays typed value", () => {
    const { container } = render(<Textarea placeholder="Test" />);
    const textarea = container.querySelector("textarea")!;
    fireEvent.change(textarea, { target: { value: "hello world" } });
    expect(textarea).toHaveValue("hello world");
  });

  it("forwards ref to textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Test" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("applies custom className", () => {
    const { container } = render(<Textarea className="my-textarea" placeholder="Test" />);
    expect(container.querySelector("textarea")).toHaveClass("my-textarea");
  });

  it("passes through rows attribute", () => {
    const { container } = render(<Textarea rows={5} placeholder="Test" />);
    expect(container.querySelector("textarea")).toHaveAttribute("rows", "5");
  });

  it("passes through maxLength attribute", () => {
    const { container } = render(<Textarea maxLength={100} placeholder="Test" />);
    expect(container.querySelector("textarea")).toHaveAttribute("maxlength", "100");
  });
});
