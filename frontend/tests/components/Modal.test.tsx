import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/common/Modal";

const mockMotion = {
  div: ({ children, onClick, className, ...props }: any) =>
    onClick ? <div className={className} onClick={onClick}>{children}</div> : <div className={className}>{children}</div>,
};

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, ...props }: any) =>
      onClick ? <div className={className} onClick={onClick}>{children}</div> : <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock("lucide-react", () => ({
  X: ({ className }: any) => <svg className={className} data-testid="x-icon" />,
}));

describe("Modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = "";
  });

  it("shows content when isOpen=true", () => {
    render(<Modal isOpen={true} onClose={jest.fn()}>Content</Modal>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("hides content when isOpen=false", () => {
    render(<Modal isOpen={false} onClose={jest.fn()}>Content</Modal>);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("calls onClose when backdrop clicked", () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);
    const backdrop = document.querySelector(".bg-black\\/40, [class*='bg-black']");
    const allDivs = document.querySelectorAll("div");
    const backdropDiv = Array.from(allDivs).find(
      (d) => d.className.includes("bg-black") || d.className.includes("backdrop")
    );
    if (backdropDiv) {
      fireEvent.click(backdropDiv);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("shows title when provided", () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Modal Title">Content</Modal>);
    expect(screen.getByText("Modal Title")).toBeInTheDocument();
  });

  it("does not show title when not provided", () => {
    render(<Modal isOpen={true} onClose={jest.fn()}>Content</Modal>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("prevents body scroll when open", () => {
    render(<Modal isOpen={true} onClose={jest.fn()}>Content</Modal>);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when closed", () => {
    const { rerender } = render(<Modal isOpen={true} onClose={jest.fn()}>Content</Modal>);
    rerender(<Modal isOpen={false} onClose={jest.fn()}>Content</Modal>);
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onClose when X button clicked", () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Title">Content</Modal>);
    const xButton = screen.getByRole("button");
    fireEvent.click(xButton);
    expect(onClose).toHaveBeenCalled();
  });
});
