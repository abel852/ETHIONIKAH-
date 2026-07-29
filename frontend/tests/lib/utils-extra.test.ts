import { formatRemaining, formatLastSeen, getErrorMessage } from "@/lib/utils";

afterEach(() => {
  jest.useRealTimers();
});

describe("formatRemaining", () => {
  it("returns 'Expired' for past date", () => {
    expect(formatRemaining("2020-01-01", Date.now())).toBe("Expired");
  });

  it("returns days and hours for > 1 day", () => {
    const now = Date.now();
    const future = now + 3 * 86400000 + 5 * 3600000;
    const result = formatRemaining(new Date(future).toISOString(), now);
    expect(result).toContain("3d");
    expect(result).toContain("5h");
  });

  it("returns hours and mins for < 1 day", () => {
    const now = Date.now();
    const future = now + 5 * 3600000 + 30 * 60000;
    const result = formatRemaining(new Date(future).toISOString(), now);
    expect(result).toContain("5h");
    expect(result).toContain("30m");
  });

  it("returns only mins for < 1 hour", () => {
    const now = Date.now();
    const future = now + 45 * 60000;
    expect(formatRemaining(new Date(future).toISOString(), now)).toBe("45m");
  });

  it("returns 'Expired' for exactly now", () => {
    const now = Date.now();
    expect(formatRemaining(new Date(now).toISOString(), now)).toBe("Expired");
  });
});

describe("formatLastSeen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns empty string for undefined", () => {
    expect(formatLastSeen(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatLastSeen(null)).toBe("");
  });

  it("returns 'Online' for < 1 min ago", () => {
    expect(formatLastSeen("2024-06-15T11:59:45Z")).toBe("Online");
  });

  it("returns minutes ago for < 60 mins", () => {
    expect(formatLastSeen("2024-06-15T11:30:00Z")).toBe("Last seen 30 minutes ago");
  });

  it("returns singular minute for 1 min ago", () => {
    expect(formatLastSeen("2024-06-15T11:59:00Z")).toBe("Last seen 1 minute ago");
  });

  it("returns hours ago for < 24 hours", () => {
    expect(formatLastSeen("2024-06-15T06:00:00Z")).toBe("Last seen 6 hours ago");
  });

  it("returns singular hour for 1 hour ago", () => {
    expect(formatLastSeen("2024-06-15T11:00:00Z")).toBe("Last seen 1 hour ago");
  });

  it("returns 'Last seen yesterday' for 1 day ago", () => {
    expect(formatLastSeen("2024-06-14T12:00:00Z")).toBe("Last seen yesterday");
  });

  it("returns 'Last seen within a week' for < 7 days", () => {
    expect(formatLastSeen("2024-06-11T12:00:00Z")).toBe("Last seen within a week");
  });

  it("returns 'Last seen within a month' for < 31 days", () => {
    expect(formatLastSeen("2024-05-20T12:00:00Z")).toBe("Last seen within a month");
  });

  it("returns 'Last seen a long time ago' for > 31 days", () => {
    expect(formatLastSeen("2023-01-01T12:00:00Z")).toBe("Last seen a long time ago");
  });
});

describe("getErrorMessage", () => {
  it("returns fallback for null", () => {
    expect(getErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("returns custom fallback", () => {
    expect(getErrorMessage(null, "Custom error")).toBe("Custom error");
  });

  it("returns response.data.error", () => {
    const err = { response: { data: { error: "Server error" } } };
    expect(getErrorMessage(err)).toBe("Server error");
  });

  it("returns network error for ERR_NETWORK", () => {
    const err = { code: "ERR_NETWORK" };
    expect(getErrorMessage(err)).toContain("Unable to connect to server");
  });

  it("returns network error for Network Error message", () => {
    const err = { message: "Network Error" };
    expect(getErrorMessage(err)).toContain("Unable to connect to server");
  });

  it("returns timeout error for ECONNABORTED", () => {
    const err = { code: "ECONNABORTED" };
    expect(getErrorMessage(err)).toContain("Request timed out");
  });

  it("returns string error as-is", () => {
    expect(getErrorMessage("Simple error")).toBe("Simple error");
  });

  it("returns err.message as fallback", () => {
    const err = { message: "Generic error" };
    expect(getErrorMessage(err)).toBe("Generic error");
  });

  it("returns fallback for unknown shape", () => {
    const err = { foo: "bar" };
    expect(getErrorMessage(err)).toBe("Something went wrong. Please try again.");
  });
});
