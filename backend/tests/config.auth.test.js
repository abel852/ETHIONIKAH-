const jwt = require("jsonwebtoken");

jest.mock("jsonwebtoken");

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../src/config/auth");

const OLD_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...OLD_ENV };
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("generateAccessToken", () => {
  it("signs payload with JWT_SECRET and JWT_EXPIRES_IN", () => {
    const payload = { userId: "uuid-123", role: "user" };
    jwt.sign.mockReturnValue("access-token-value");

    const token = generateAccessToken(payload);

    expect(jwt.sign).toHaveBeenCalledWith(payload, "test-secret", {
      expiresIn: "15m",
    });
    expect(token).toBe("access-token-value");
  });

  it("uses default expiry when JWT_EXPIRES_IN is not set", () => {
    delete process.env.JWT_EXPIRES_IN;
    generateAccessToken({ userId: "1" });
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "1" },
      expect.any(String),
      { expiresIn: "15m" }
    );
  });
});

describe("generateRefreshToken", () => {
  it("signs payload with JWT_REFRESH_SECRET and JWT_REFRESH_EXPIRES_IN", () => {
    const payload = { userId: "uuid-123" };
    jwt.sign.mockReturnValue("refresh-token-value");

    const token = generateRefreshToken(payload);

    expect(jwt.sign).toHaveBeenCalledWith(payload, "test-refresh-secret", {
      expiresIn: "7d",
    });
    expect(token).toBe("refresh-token-value");
  });

  it("uses default expiry when JWT_REFRESH_EXPIRES_IN is not set", () => {
    delete process.env.JWT_REFRESH_EXPIRES_IN;
    generateRefreshToken({ userId: "1" });
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "1" },
      expect.any(String),
      { expiresIn: "7d" }
    );
  });
});

describe("verifyAccessToken", () => {
  it("verifies token with JWT_SECRET", () => {
    const decoded = { userId: "uuid-123", role: "user" };
    jwt.verify.mockReturnValue(decoded);

    const result = verifyAccessToken("some-token");

    expect(jwt.verify).toHaveBeenCalledWith("some-token", "test-secret");
    expect(result).toEqual(decoded);
  });

  it("throws when token is invalid", () => {
    jwt.verify.mockImplementation(() => { throw new Error("jwt malformed"); });

    expect(() => verifyAccessToken("bad-token")).toThrow("jwt malformed");
  });
});

describe("verifyRefreshToken", () => {
  it("verifies token with JWT_REFRESH_SECRET", () => {
    const decoded = { userId: "uuid-123" };
    jwt.verify.mockReturnValue(decoded);

    const result = verifyRefreshToken("refresh-token");

    expect(jwt.verify).toHaveBeenCalledWith("refresh-token", "test-refresh-secret");
    expect(result).toEqual(decoded);
  });

  it("throws when refresh token is expired", () => {
    jwt.verify.mockImplementation(() => { throw new Error("jwt expired"); });

    expect(() => verifyRefreshToken("expired-token")).toThrow("jwt expired");
  });
});
