import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "@/app/error";

jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  return MockLink;
});

describe("ErrorPage", () => {
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders error heading", () => {
    const error = new Error("Test error");
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders error message from error object", () => {
    const error = new Error("Custom error message");
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("renders default error message when no message provided", () => {
    const error = new Error();
    render(<ErrorPage error={error} reset={mockReset} />);
    expect(
      screen.getByText("An unexpected error occurred. Please try again.")
    ).toBeInTheDocument();
  });

  it("calls reset when Try Again button is clicked", () => {
    const error = new Error("Test error");
    render(<ErrorPage error={error} reset={mockReset} />);
    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("renders Go Home link pointing to /", () => {
    const error = new Error("Test error");
    render(<ErrorPage error={error} reset={mockReset} />);
    const goHomeLink = screen.getByText("Go Home");
    expect(goHomeLink).toBeInTheDocument();
    expect(goHomeLink.closest("a")).toHaveAttribute("href", "/");
  });
});
