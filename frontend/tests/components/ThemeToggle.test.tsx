import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/common/ThemeToggle";

jest.mock("@/hooks", () => ({
  useTheme: jest.fn(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

import { useTheme } from "@/hooks";

describe("ThemeToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows Moon icon in light mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme: jest.fn(),
    });
    const { container } = render(<ThemeToggle />);
    const moonIcon = container.querySelector("svg");
    expect(moonIcon).toBeInTheDocument();
  });

  it("shows Sun icon in dark mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      toggleTheme: jest.fn(),
    });
    const { container } = render(<ThemeToggle />);
    const sunIcon = container.querySelector("svg");
    expect(sunIcon).toBeInTheDocument();
  });

  it("calls toggleTheme on click", () => {
    const toggleTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme,
    });
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(toggleTheme).toHaveBeenCalled();
  });

  it("has correct aria-label in light mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "light",
      toggleTheme: jest.fn(),
    });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to dark mode");
  });

  it("has correct aria-label in dark mode", () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: "dark",
      toggleTheme: jest.fn(),
    });
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to light mode");
  });
});
