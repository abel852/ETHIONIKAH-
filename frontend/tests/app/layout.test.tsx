import "@testing-library/jest-dom";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
}));

jest.mock("next/script", () => {
  const MockScript = (props: any) => null;
  return MockScript;
});

jest.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/context/ThemeContext", () => ({
  ThemeProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/components/common", () => ({
  ToastProvider: () => null,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("RootLayout", () => {
  it("exports metadata with correct title", async () => {
    const layout = await import("@/app/layout");
    expect(layout.metadata.title).toBe("Ethio Nikah - Islamic Matchmaking Platform");
  });

  it("exports metadata with correct description", async () => {
    const layout = await import("@/app/layout");
    expect(layout.metadata.description).toBe(
      "Find your righteous spouse in a safe, Sharia-compliant environment. Premium matchmaking for the Muslim community in Ethiopia."
    );
  });

  it("exports metadata with keywords array", async () => {
    const layout = await import("@/app/layout");
    expect(layout.metadata.keywords).toContain("Islamic marriage");
    expect(layout.metadata.keywords).toContain("Ethio Nikah");
  });

  it("exports RootLayout as default export", async () => {
    const layout = await import("@/app/layout");
    expect(layout.default).toBeDefined();
    expect(typeof layout.default).toBe("function");
  });
});
