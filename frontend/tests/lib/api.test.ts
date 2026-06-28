jest.mock("axios");

import axios from "axios";
import api from "@/lib/api";

const mockInstance = (api as unknown) as ReturnType<typeof Object.assign> & {
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
  mockResolvedValueOnce: jest.Mock["mockResolvedValueOnce"];
};

const requestHandler: (config: any) => any =
  mockInstance.interceptors.request.use.mock.calls[0][0];
const successHandler: (res: any) => any =
  mockInstance.interceptors.response.use.mock.calls[0][0];
const errorHandler: (err: any) => any =
  mockInstance.interceptors.response.use.mock.calls[0][1];

describe("api client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("request interceptor", () => {
    it("adds Authorization header when accessToken exists in localStorage", () => {
      localStorage.setItem("accessToken", "test-token-123");
      const config = { headers: {} };
      const result = requestHandler(config);
      expect(result.headers.Authorization).toBe("Bearer test-token-123");
    });

    it("does not add Authorization header when no token in localStorage", () => {
      const config = { headers: {} };
      const result = requestHandler(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it("returns the config unchanged", () => {
      localStorage.setItem("accessToken", "token");
      const config = { headers: {} };
      const result = requestHandler(config);
      expect(result).toBe(config);
    });

    it("skips setting header when typeof window is undefined (SSR)", () => {
      const { window: _win } = global;
      delete (global as any).window;
      const config = { headers: {} };
      const result = requestHandler(config);
      expect(result.headers.Authorization).toBeUndefined();
      (global as any).window = _win;
    });
  });

  describe("response interceptor", () => {
    it("passes through successful responses", () => {
      const response = { data: { id: 1 }, status: 200 };
      const result = successHandler(response);
      expect(result).toBe(response);
    });

    it("rejects non-401 errors", async () => {
      const error = { config: {}, response: { status: 500 }, message: "Server error" };
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    it("rejects errors with no config", async () => {
      const error = { response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    it("rejects 401 without redirect when request had no Authorization header", async () => {
      const error = { config: { headers: {} }, response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    it("handles 401 by refreshing token and retrying", async () => {
      localStorage.setItem("accessToken", "expired-token");
      localStorage.setItem("refreshToken", "refresh-123");
      (axios.post as jest.Mock).mockResolvedValueOnce({
        data: { accessToken: "new-access-token" },
      });
      (mockInstance as unknown as jest.Mock).mockResolvedValueOnce({
        data: { id: 1 },
      });

      const error = { config: { headers: { Authorization: "Bearer expired-token" } }, response: { status: 401 } };
      const result = await errorHandler(error);

      expect(axios.post).toHaveBeenCalledWith("http://test.com/api/auth/refresh", {
        refreshToken: "refresh-123",
      });
      expect(localStorage.getItem("accessToken")).toBe("new-access-token");
      expect(error.config.headers.Authorization).toBe("Bearer new-access-token");
      expect(mockInstance as unknown as jest.Mock).toHaveBeenCalledWith(error.config);
      expect(result).toEqual({ data: { id: 1 } });
    });

    it("handles 401 with _retry flag and does not loop", async () => {
      const error = { config: { _retry: true, headers: {} }, response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    it("handles 401 with _noRedirect flag and does not redirect", async () => {
      localStorage.setItem("accessToken", "token");
      const error = { config: { _noRedirect: true, headers: { Authorization: "Bearer token" } }, response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    it("clears storage and redirects when refresh fails", async () => {
      localStorage.setItem("refreshToken", "refresh-123");
      localStorage.setItem("accessToken", "old-token");
      localStorage.setItem("user", '{"id":1}');
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error("Refresh failed"));

      const error = { config: { headers: { Authorization: "Bearer old-token" } }, response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBeDefined();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("clears storage and redirects when no refresh token exists", async () => {
      localStorage.removeItem("refreshToken");
      localStorage.setItem("accessToken", "old-token");
      localStorage.setItem("user", '{"id":1}');

      const error = { config: { headers: { Authorization: "Bearer old-token" } }, response: { status: 401 } };
      await expect(errorHandler(error)).rejects.toBeDefined();
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });
});
