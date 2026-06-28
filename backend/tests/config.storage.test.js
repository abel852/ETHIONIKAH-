const path = require("path");

const mockDiskStorage = jest.fn(() => ({
  _destination: jest.fn(),
  _filename: jest.fn(),
}));

const mockMulter = jest.fn(() => ({
  single: jest.fn(),
  array: jest.fn(),
  fields: jest.fn(),
}));

mockMulter.diskStorage = mockDiskStorage;

jest.mock("multer", () => mockMulter);

jest.mock("uuid", () => ({
  v4: jest.fn(() => "550e8400-e29b-41d4-a716-446655440000"),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

let originalEnv;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  originalEnv = process.env.NODE_ENV;
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});

describe("multer storage configuration", () => {
  it("creates multer instance with storage, fileFilter, and limits", () => {
    const upload = require("../src/config/storage");

    expect(mockMulter).toHaveBeenCalledWith({
      storage: expect.objectContaining({}),
      fileFilter: expect.any(Function),
      limits: { fileSize: 5 * 1024 * 1024 },
    });
  });

  it("configures diskStorage with destination and filename functions", () => {
    require("../src/config/storage");

    expect(mockDiskStorage).toHaveBeenCalledWith({
      destination: expect.any(Function),
      filename: expect.any(Function),
    });
  });
});

describe("storage destination function", () => {
  function getDestinationFn() {
    require("../src/config/storage");
    return mockDiskStorage.mock.calls[0][0].destination;
  }

  it("returns uploads/profile-photos for profilePhoto fieldname", () => {
    const destFn = getDestinationFn();
    const cb = jest.fn();

    destFn(null, { fieldname: "profilePhoto" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "uploads/profile-photos");
  });

  it("returns uploads/profile-photos for photo fieldname", () => {
    const destFn = getDestinationFn();
    const cb = jest.fn();

    destFn(null, { fieldname: "photo" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "uploads/profile-photos");
  });

  it("returns uploads/national-ids for idPhoto fieldname", () => {
    const destFn = getDestinationFn();
    const cb = jest.fn();

    destFn(null, { fieldname: "idPhoto" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "uploads/national-ids");
  });

  it("returns uploads/selfies for selfiePhoto fieldname", () => {
    const destFn = getDestinationFn();
    const cb = jest.fn();

    destFn(null, { fieldname: "selfiePhoto" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "uploads/selfies");
  });

  it("returns default uploads folder for unknown fieldname", () => {
    const destFn = getDestinationFn();
    const cb = jest.fn();

    destFn(null, { fieldname: "unknown" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "uploads");
  });
});

describe("storage filename function", () => {
  function getFilenameFn() {
    require("../src/config/storage");
    return mockDiskStorage.mock.calls[0][0].filename;
  }

  it("generates UUID-based filename preserving original extension", () => {
    const filenameFn = getFilenameFn();
    const cb = jest.fn();

    filenameFn(null, { originalname: "photo.jpg" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "550e8400-e29b-41d4-a716-446655440000.jpg");
  });

  it("handles files without extension", () => {
    const filenameFn = getFilenameFn();
    const cb = jest.fn();

    filenameFn(null, { originalname: "photo" }, cb);

    expect(cb).toHaveBeenCalledWith(null, "550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("fileFilter function", () => {
  function getFileFilter() {
    require("../src/config/storage");
    return mockMulter.mock.calls[0][0].fileFilter;
  }

  it("accepts JPEG images", () => {
    const fileFilter = getFileFilter();
    const cb = jest.fn();

    fileFilter(null, { mimetype: "image/jpeg" }, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("accepts PNG images", () => {
    const fileFilter = getFileFilter();
    const cb = jest.fn();

    fileFilter(null, { mimetype: "image/png" }, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("accepts WebP images", () => {
    const fileFilter = getFileFilter();
    const cb = jest.fn();

    fileFilter(null, { mimetype: "image/webp" }, cb);

    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("rejects non-image file types with an error", () => {
    const fileFilter = getFileFilter();
    const cb = jest.fn();

    fileFilter(null, { mimetype: "application/pdf" }, cb);

    expect(cb).toHaveBeenCalledWith(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  });
});
