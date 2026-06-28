const mockRateLimit = jest.fn(() => jest.fn((req, res, next) => next()));

jest.mock("express-rate-limit", () => mockRateLimit);

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...OLD_ENV };
  mockRateLimit.mockImplementation(() => jest.fn((req, res, next) => next()));
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("apiLimiter", () => {
  it("uses default windowMs of 900000 and max of 100 when env vars are not set", () => {
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;

    const { apiLimiter } = require("../src/middleware/rateLimiter");

    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 900000,
        max: 100,
        message: { error: "Too many requests, please try again later" },
      })
    );
    expect(typeof apiLimiter).toBe("function");
  });

  it("uses environment variable overrides for windowMs and max", () => {
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX = "50";

    const { apiLimiter } = require("../src/middleware/rateLimiter");

    expect(mockRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 60000,
        max: 50,
      })
    );
    expect(typeof apiLimiter).toBe("function");
  });
});

describe("authLimiter", () => {
  it("uses hardcoded windowMs of 900000 (15 min) and max of 5", () => {
    const { authLimiter } = require("../src/middleware/rateLimiter");

    const calls = mockRateLimit.mock.calls;
    const authCall = calls.find((c) => c[0].max === 5);
    expect(authCall).toBeDefined();
    expect(authCall[0]).toMatchObject({
      windowMs: 900000,
      message: { error: "Too many authentication attempts" },
    });
    expect(typeof authLimiter).toBe("function");
  });
});

describe("express-rate-limit", () => {
  it("is called exactly twice for apiLimiter and authLimiter", () => {
    require("../src/middleware/rateLimiter");

    expect(mockRateLimit).toHaveBeenCalledTimes(2);
  });

  it("configures standardHeaders true and legacyHeaders false for apiLimiter", () => {
    require("../src/middleware/rateLimiter");

    const calls = mockRateLimit.mock.calls;
    const apiCall = calls.find((c) => c[0].max === 100 || c[0].max === undefined);
    const call = apiCall || calls[0];
    expect(call[0]).toMatchObject({
      standardHeaders: true,
      legacyHeaders: false,
    });
  });
});
