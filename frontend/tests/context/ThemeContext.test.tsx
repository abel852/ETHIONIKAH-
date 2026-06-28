import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

const STORAGE_KEY = "ethio-nikah-theme";

function TestComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-light" onClick={() => setTheme("light")}>Set Light</button>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>Set Dark</button>
    </div>
  );
}

function TestErrorComponent() {
  try {
    useTheme();
  } catch (e) {
    return <div data-testid="error">{(e as Error).message}</div>;
  }
  return null;
}

const originalMatchMedia = window.matchMedia;

describe("ThemeContext", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("provides default theme (light) when no localStorage value", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("reads theme from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("toggleTheme switches from light to dark", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("light");
    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("toggleTheme switches from dark to light", () => {
    localStorage.setItem(STORAGE_KEY, "dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("setTheme sets specific theme", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-dark"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");

    fireEvent.click(screen.getByTestId("set-light"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("updates localStorage when theme changes", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-dark"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("updates document classList when theme changes", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByTestId("set-dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    fireEvent.click(screen.getByTestId("set-light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("throws error when useTheme used outside provider", () => {
    render(<TestErrorComponent />);
    expect(screen.getByTestId("error").textContent).toBe("useTheme must be used within ThemeProvider");
  });
});
