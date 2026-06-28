import "@testing-library/jest-dom";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import api from "@/lib/api";
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  verification: { status: "approved" },
  role: "user",
};

function TestComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "Logged In" : "Logged Out"}</span>
      <span data-testid="loading">{isLoading ? "Loading" : "Idle"}</span>
      {user && <span data-testid="user-email">{user.email}</span>}
      <button data-testid="login-btn" onClick={() => { login("test@example.com", "pass123"); }}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders without crashing", () => {
    renderWithAuth();
    expect(screen.getByTestId("auth-status")).toBeInTheDocument();
  });

  it("shows logged out when no token", async () => {
    mockGet.mockRejectedValueOnce(new Error("No token"));
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged Out");
    });
  });

  it("logs in successfully", async () => {
    mockPost.mockResolvedValueOnce({
      data: { accessToken: "fake-jwt", refreshToken: "fake-refresh", user: mockUser },
    });
    mockGet.mockRejectedValueOnce(new Error("No token"));

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("Idle"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("login-btn"));
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/login", { email: "test@example.com", password: "pass123" });
    expect(localStorage.getItem("accessToken")).toBe("fake-jwt");
  });

  it("calls logout and clears state", async () => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("refreshToken", "test-refresh");
    localStorage.setItem("user", JSON.stringify(mockUser));

    mockGet.mockResolvedValueOnce({ data: { user: mockUser } });

    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged In");
    });

    act(() => {
      fireEvent.click(screen.getByTestId("logout-btn"));
    });

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(screen.getByTestId("auth-status")).toHaveTextContent("Logged Out");
  });
});
