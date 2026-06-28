import { cn, formatDate, formatRelativeTime, getInitials, mediaUrl, truncate } from "@/lib/utils";

describe("utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("cn", () => {
    it("combines class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
      expect(cn("base", false && "hidden", "visible")).toBe("base visible");
    });

    it("handles undefined values", () => {
      expect(cn("a", undefined, "b")).toBe("a b");
    });
  });

  describe("formatDate", () => {
    it("formats a date string correctly", () => {
      const result = formatDate("2024-01-15");
      expect(result).toBe("Jan 15, 2024");
    });

    it("formats a Date object correctly", () => {
      const result = formatDate(new Date("2024-06-01"));
      expect(result).toBe("Jun 1, 2024");
    });
  });

  describe("formatRelativeTime", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns "Just now" for less than 1 minute', () => {
      const date = new Date("2024-06-15T11:59:45Z");
      expect(formatRelativeTime(date)).toBe("Just now");
    });

    it("returns minutes ago for less than 60 minutes", () => {
      const date = new Date("2024-06-15T11:30:00Z");
      expect(formatRelativeTime(date)).toBe("30m ago");
    });

    it("returns hours ago for less than 24 hours", () => {
      const date = new Date("2024-06-15T06:00:00Z");
      expect(formatRelativeTime(date)).toBe("6h ago");
    });

    it("returns days ago for less than 7 days", () => {
      const date = new Date("2024-06-10T12:00:00Z");
      expect(formatRelativeTime(date)).toBe("5d ago");
    });

    it("returns formatted date for older dates", () => {
      const date = new Date("2024-05-01T12:00:00Z");
      expect(formatRelativeTime(date)).toBe("May 1, 2024");
    });
  });

  describe("getInitials", () => {
    it("returns first letters uppercase", () => {
      expect(getInitials("John", "Doe")).toBe("JD");
    });

    it("handles lowercase input", () => {
      expect(getInitials("john", "doe")).toBe("JD");
    });
  });

  describe("mediaUrl", () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;

    afterAll(() => {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it("returns undefined for empty path", () => {
      expect(mediaUrl()).toBeUndefined();
    });

    it("returns the URL as-is for absolute URLs", () => {
      expect(mediaUrl("https://cdn.example.com/photo.jpg")).toBe("https://cdn.example.com/photo.jpg");
    });

    it("constructs URL for relative paths", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api";
      expect(mediaUrl("/uploads/photo.jpg")).toBe("http://localhost:5000/uploads/photo.jpg");
    });

    it("handles path without leading slash", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api";
      expect(mediaUrl("uploads/photo.jpg")).toBe("http://localhost:5000/uploads/photo.jpg");
    });

    it("strips /api suffix from API URL", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api";
      expect(mediaUrl("/photo.jpg")).toBe("http://localhost:5000/photo.jpg");
    });
  });

  describe("truncate", () => {
    it("returns string as-is when shorter than length", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
    });

    it("truncates and adds ellipsis when longer than length", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("returns exact string when equal to length", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });
  });
});
