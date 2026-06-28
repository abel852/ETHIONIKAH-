const mockPrismaClient = jest.fn(() => ({
  user: { findUnique: jest.fn() },
}));

jest.mock("@prisma/client", () => ({
  PrismaClient: mockPrismaClient,
}));

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("database config", () => {
  it("creates PrismaClient with error log in non-development environment", () => {
    process.env.NODE_ENV = "production";

    const prisma = require("../src/config/database");

    expect(mockPrismaClient).toHaveBeenCalledWith({
      log: ["error"],
    });
  });

  it("creates PrismaClient with query, error, and warn logs in development", () => {
    process.env.NODE_ENV = "development";

    const prisma = require("../src/config/database");

    expect(mockPrismaClient).toHaveBeenCalledWith({
      log: ["query", "error", "warn"],
    });
  });

  it("returns a PrismaClient instance", () => {
    const prisma = require("../src/config/database");

    expect(prisma).toBeDefined();
  });

  it("includes all expected model accessors", () => {
    const prisma = require("../src/config/database");

    expect(prisma.user).toBeDefined();
    expect(typeof prisma.user.findUnique).toBe("function");
  });
});
