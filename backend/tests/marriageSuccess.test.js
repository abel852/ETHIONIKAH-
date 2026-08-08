const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.PORT = "0";

// ============================================================
// Mock external dependencies
// ============================================================
jest.mock("speakeasy", () => ({
  generateSecret: jest.fn(() => ({ base32: "MOCK", otpauth_url: "otpauth://totp/test" })),
  totp: { verify: jest.fn(() => true) },
  otpauthURL: jest.fn(() => "otpauth://totp/test"),
}));
jest.mock("qrcode", () => ({ toDataURL: jest.fn(() => Promise.resolve("data:image/png;base64,mock")) }));
jest.mock("otplib", () => ({
  authenticator: { generate: jest.fn(() => "123456"), generateSecret: jest.fn(() => "MOCK"), verify: jest.fn(() => true), keyuri: jest.fn(() => "otpauth://totp/test") },
}));

// Mock messageSocket to avoid real socket connections
jest.mock("../src/utils/messageSocket", () => ({
  emitNotification: jest.fn(),
  setSocket: jest.fn(),
  getSocket: jest.fn(() => null),
}));

// Mock email to avoid sending real emails
jest.mock("../src/utils/email", () => ({
  sendNotificationEmail: jest.fn(() => Promise.resolve()),
  sendEmail: jest.fn(() => Promise.resolve()),
}));

// Mock push service
jest.mock("../src/utils/pushService", () => ({
  sendPushToUser: jest.fn(() => Promise.resolve()),
}));

// Mock audit logger
jest.mock("../src/utils/auditLogger", () => ({
  logAudit: jest.fn(() => Promise.resolve()),
}));

// Mock notification utility
jest.mock("../src/utils/notification", () => ({
  createNotification: jest.fn(() => Promise.resolve()),
  notifyAllAdmins: jest.fn(() => Promise.resolve()),
}));

// Mock R2 storage
jest.mock("../src/config/r2", () => ({
  uploadMulterFile: jest.fn(async (file, folder) => `/uploads/${folder}/${file.filename}`),
  isR2Enabled: jest.fn(() => false),
  getStorageUsage: jest.fn(() => ({ used: 0, total: 1024 * 1024 * 1024 })),
  deleteOldFiles: jest.fn(),
}));

// Mock Redis to avoid real connections
jest.mock("../src/config/redis", () => ({
  getGeneralClient: jest.fn(() => null),
  getRateLimitClient: jest.fn(() => null),
  getSocketClient: jest.fn(() => null),
}));

// ============================================================
// Mock Prisma with all models needed by marriage success
// ============================================================
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  profile: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
  exclusivePartnership: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  marriageSuccess: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    create: jest.fn(async (args) => ({ id: "notif-id", ...args.data })),
    createMany: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
  },
  adminPermission: {
    findMany: jest.fn(() => []),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(async (fn) => fn(mockPrisma)),
};

jest.mock("../src/config/database", () => mockPrisma);

// ============================================================
// Setup
// ============================================================
let app;
beforeAll(() => {
  const server = require("../src/server");
  app = server.app;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Clear any leftover mockResolvedValueOnce entries on findUnique
  mockPrisma.user.findUnique.mockReset();
  // Re-establish default mock implementations
  mockPrisma.user.findMany.mockResolvedValue([]);
  mockPrisma.adminPermission.findMany.mockResolvedValue([]);
  mockPrisma.notification.create.mockResolvedValue({ id: "notif-id" });
  mockPrisma.notification.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
  // Re-establish R2 mock defaults
  const r2 = require("../src/config/r2");
  r2.uploadMulterFile.mockImplementation(async (file, folder) => `/uploads/${folder}/${file.filename}`);
  r2.isR2Enabled.mockReturnValue(false);
});

// ============================================================
// Helpers
// ============================================================
function makeToken(userId, role = "user") {
  return jwt.sign({ userId, role, tokenVersion: 0 }, process.env.JWT_SECRET);
}

const USER_A = "user-aaa-111";
const USER_B = "user-bbb-222";
const ADMIN_ID = "admin-ccc-333";
const PARTNERSHIP_ID = "partnership-ppp-001";
const SUBMISSION_ID = "submission-sss-001";

function mockActivePartnership() {
  mockPrisma.exclusivePartnership.findFirst.mockResolvedValue({
    id: PARTNERSHIP_ID,
    userAId: USER_A,
    userBId: USER_B,
    status: "active",
  });
}

function mockUsersNotMarried() {
  mockPrisma.user.findMany.mockResolvedValue([
    { id: USER_A, isMarried: false },
    { id: USER_B, isMarried: false },
  ]);
}

// Default auth response: valid user with tokenVersion 0
const DEFAULT_AUTH_USER = {
  tokenVersion: 0,
  isActive: true,
  deletedAt: null,
  isDeleted: false,
};

function mockAuthedUser(userId, role = "user", extra = {}) {
  // mockReset clears both call history and mockResolvedValueOnce queue
  // This prevents leftover once-entries from previous tests bleeding through
  mockPrisma.user.findUnique.mockReset();
  mockPrisma.user.findUnique.mockResolvedValue({
    id: userId,
    role,
    isActive: true,
    isMarried: false,
    tokenVersion: 0,
    deletedAt: null,
    isDeleted: false,
    adminRole: role === "admin" ? "admin" : null,
    ...extra,
  });
}

// Use when the controller needs different data from the auth middleware
function mockAuthedUserWithControllerData(userId, authData, controllerData) {
  mockPrisma.user.findUnique
    .mockResolvedValueOnce({ ...DEFAULT_AUTH_USER, id: userId, role: authData.role || "user", adminRole: authData.role === "admin" ? "admin" : null, ...authData })
    .mockResolvedValueOnce(controllerData);
}

// ============================================================
// TEST SUITE
// ============================================================
describe("Marriage Success Feature", () => {

  // ============================================================
  // 1. Non-exclusive user cannot request marriage success
  // ============================================================
  describe("1. Non-exclusive user cannot request", () => {
    it("should return 403 when no active partnership exists", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.exclusivePartnership.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("active exclusive partnership");
    });
  });

  // ============================================================
  // 2. Exclusive partners can request
  // ============================================================
  describe("2. Exclusive partner can request", () => {
    it("should return 201 with submission in pending_partner_confirm status", async () => {
      mockAuthedUser(USER_A);
      mockActivePartnership();
      mockUsersNotMarried();
      mockPrisma.marriageSuccess.findFirst.mockResolvedValue(null);
      mockPrisma.marriageSuccess.create.mockResolvedValue({
        id: SUBMISSION_ID,
        partnershipId: PARTNERSHIP_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_partner_confirm",
        initiatorConfirmed: true,
        partnerConfirmed: false,
      });
      // auth middleware calls findUnique first, then controller calls it for user details (notification)
      // mockAuthedUser already set mockResolvedValue; add once-entries for the 2 calls
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: USER_A, role: "user", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: null }) // auth
        .mockResolvedValueOnce({ id: USER_A, firstName: "John", lastName: "Doe" }); // for notification

      const res = await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(201);
      expect(res.body.submission.status).toBe("pending_partner_confirm");
      expect(res.body.submission.initiatorConfirmed).toBe(true);
      expect(res.body.submission.partnerConfirmed).toBe(false);
    });
  });

  // ============================================================
  // 3. One partner submits a marriage request (already covered above)
  //    + verify notification is sent to partner
  // ============================================================
  describe("3. Marriage request sends notification to partner", () => {
    it("should create a notification for the partner", async () => {
      mockAuthedUser(USER_A);
      mockActivePartnership();
      mockUsersNotMarried();
      mockPrisma.marriageSuccess.findFirst.mockResolvedValue(null);
      mockPrisma.marriageSuccess.create.mockResolvedValue({
        id: SUBMISSION_ID,
        partnershipId: PARTNERSHIP_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_partner_confirm",
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: USER_A, role: "user", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: null })
        .mockResolvedValueOnce({ id: USER_A, firstName: "John", lastName: "Doe" });

      await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      // createNotification is mocked via jest.mock("../src/utils/notification")
      const { createNotification } = require("../src/utils/notification");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_B,
          type: "marriage_success_request",
        })
      );
    });
  });

  // ============================================================
  // 4. The other partner accepts the request
  // ============================================================
  describe("4. Partner confirms marriage request", () => {
    it("should return 200 and update status to pending_upload", async () => {
      mockAuthedUser(USER_B);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        partnerId: USER_B,
        initiatorId: USER_A,
        status: "pending_partner_confirm",
      });
      mockPrisma.marriageSuccess.update.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_upload",
        partnerConfirmed: true,
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/confirm`)
        .set("Authorization", `Bearer ${makeToken(USER_B)}`);

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe("pending_upload");
      expect(res.body.submission.partnerConfirmed).toBe(true);
    });

    it("should return 403 if non-partner tries to confirm", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        partnerId: USER_B,
        initiatorId: USER_A,
        status: "pending_partner_confirm",
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/confirm`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });

    it("should return 400 if submission is not in pending_partner_confirm", async () => {
      mockAuthedUser(USER_B);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        partnerId: USER_B,
        status: "pending_upload",
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/confirm`)
        .set("Authorization", `Bearer ${makeToken(USER_B)}`);

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 5. Both users can upload multiple marriage proof images
  // ============================================================
  describe("5. Upload marriage photos", () => {
    it("should accept multiple files and update status to pending_admin_review", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_upload",
      });
      mockPrisma.marriageSuccess.update.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        weddingPhotos: ["/uploads/marriage-photos/w1.jpg"],
        engagementPhotos: ["/uploads/marriage-photos/e1.jpg"],
        ringPhotos: ["/uploads/marriage-photos/r1.jpg"],
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/upload`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .field("successStory", "We met on this platform and fell in love!")
        .field("consentToPublish", "true")
        .attach("weddingPhotos", Buffer.from("fake-image-data"), "wedding.jpg")
        .attach("engagementPhotos", Buffer.from("fake-image-data"), "engagement.jpg")
        .attach("ringPhotos", Buffer.from("fake-image-data"), "ring.jpg");

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe("pending_admin_review");
      expect(mockPrisma.marriageSuccess.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "pending_admin_review",
            successStory: "We met on this platform and fell in love!",
            consentToPublish: true,
          }),
        })
      );
    });

    it("should return 403 if user is not part of submission", async () => {
      mockAuthedUser("random-user");
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_upload",
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/upload`)
        .set("Authorization", `Bearer ${makeToken("random-user")}`)
        .field("successStory", "test");

      expect(res.status).toBe(403);
    });

    it("should return 400 if submission is not in upload phase", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_admin_review",
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/upload`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .field("successStory", "test");

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 6. Uploaded files are stored correctly
  // ============================================================
  describe("6. File storage", () => {
    it("should call uploadMulterFile for each uploaded file when R2 is enabled", async () => {
      const r2 = require("../src/config/r2");
      // Enable R2 so uploadMulterFile gets called instead of local fallback
      r2.isR2Enabled.mockReturnValue(true);
      r2.uploadMulterFile.mockImplementation(async (file, folder) => `/uploads/${folder}/${file.filename}`);

      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_upload",
      });
      mockPrisma.marriageSuccess.update.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
      });

      await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/upload`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .field("consentToPublish", "false")
        .attach("weddingPhotos", Buffer.from("fake-image"), "w1.jpg")
        .attach("weddingPhotos", Buffer.from("fake-image"), "w2.jpg")
        .attach("ringPhotos", Buffer.from("fake-image"), "r1.jpg");

      expect(r2.uploadMulterFile).toHaveBeenCalledTimes(3);
      // Verify folder parameter
      expect(r2.uploadMulterFile).toHaveBeenCalledWith(expect.any(Object), "marriage-photos");
    });

    it("should use local fallback when R2 is not enabled", async () => {
      const r2 = require("../src/config/r2");
      r2.isR2Enabled.mockReturnValue(false);
      r2.uploadMulterFile.mockClear();
      r2.uploadMulterFile.mockImplementation(async (file, folder) => `/uploads/${folder}/${file.filename}`);

      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_upload",
      });
      mockPrisma.marriageSuccess.update.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        weddingPhotos: ["/uploads/marriage-photos/w1.jpg"],
      });

      const res = await request(app)
        .post(`/api/marriage-success/${SUBMISSION_ID}/upload`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .field("consentToPublish", "false")
        .attach("weddingPhotos", Buffer.from("fake-image"), "w1.jpg");

      expect(res.status).toBe(200);
      // uploadMulterFile should NOT be called when R2 is disabled
      expect(r2.uploadMulterFile).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 7. Admin can view all pending marriage requests
  // ============================================================
  describe("7. Admin views pending submissions", () => {
    it("should return list of submissions for admin", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      const mockSubmissions = [
        {
          id: SUBMISSION_ID,
          status: "pending_admin_review",
          initiator: { id: USER_A, firstName: "John", lastName: "Doe", email: "john@test.com" },
          partner: { id: USER_B, firstName: "Jane", lastName: "Doe", email: "jane@test.com" },
          createdAt: new Date(),
        },
      ];
      mockPrisma.marriageSuccess.findMany.mockResolvedValue(mockSubmissions);

      const res = await request(app)
        .get("/api/marriage-success/admin/submissions?status=pending_admin_review")
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`);

      expect(res.status).toBe(200);
      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.submissions[0].status).toBe("pending_admin_review");
    });

    it("should return 403 for non-admin user", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .get("/api/marriage-success/admin/submissions")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================================
  // 8. Admin can view uploaded images (via submission detail)
  // ============================================================
  describe("8. Admin views submission detail with images", () => {
    it("should return submission with wedding photos array", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        weddingPhotos: ["/uploads/marriage-photos/w1.jpg", "/uploads/marriage-photos/w2.jpg"],
        engagementPhotos: ["/uploads/marriage-photos/e1.jpg"],
        ringPhotos: [],
        marriageCertificate: "/uploads/marriage-certificates/cert.pdf",
        successStory: "Our story...",
        consentToPublish: true,
        initiator: { id: USER_A, firstName: "John", lastName: "Doe", email: "john@test.com", isMarried: false },
        partner: { id: USER_B, firstName: "Jane", lastName: "Doe", email: "jane@test.com", isMarried: false },
        partnership: {
          id: PARTNERSHIP_ID,
          userA: { id: USER_A, firstName: "John", lastName: "Doe", email: "john@test.com", isMarried: false },
          userB: { id: USER_B, firstName: "Jane", lastName: "Doe", email: "jane@test.com", isMarried: false },
        },
        admin: null,
      });

      const res = await request(app)
        .get(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}`)
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`);

      expect(res.status).toBe(200);
      expect(res.body.submission.weddingPhotos).toHaveLength(2);
      expect(res.body.submission.engagementPhotos).toHaveLength(1);
      expect(res.body.submission.marriageCertificate).toContain("cert.pdf");
    });
  });

  // ============================================================
  // 9. Admin can approve a request
  // ============================================================
  describe("9. Admin approves submission", () => {
    it("should return 200 and mark submission as approved", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        initiatorId: USER_A,
        partnerId: USER_B,
        partnershipId: PARTNERSHIP_ID,
      });

      // Mock $transaction to execute the callback with mockPrisma
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        // Mock the updates inside the transaction
        mockPrisma.marriageSuccess.update.mockResolvedValue({
          id: SUBMISSION_ID,
          status: "approved",
          adminId: ADMIN_ID,
        });
        mockPrisma.user.update.mockResolvedValue({});
        mockPrisma.profile.updateMany.mockResolvedValue({ count: 2 });
        mockPrisma.exclusivePartnership.update.mockResolvedValue({});
        return await fn(mockPrisma);
      });

      const res = await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/approve`)
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`)
        .send({ adminNote: "Looks great!" });

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe("approved");
    });

    it("should return 400 if submission is not pending review", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "approved",
      });

      const res = await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/approve`)
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`);

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 10. After approval: both users marked married, features disabled
  // ============================================================
  describe("10. Post-approval effects", () => {
    it("should mark both users as married and end partnership", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        initiatorId: USER_A,
        partnerId: USER_B,
        partnershipId: PARTNERSHIP_ID,
      });

      const updateCalls = [];
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        mockPrisma.marriageSuccess.update.mockImplementation(({ data }) => {
          updateCalls.push({ model: "marriageSuccess", data });
          return { id: SUBMISSION_ID, ...data };
        });
        mockPrisma.user.update.mockImplementation(({ where, data }) => {
          updateCalls.push({ model: "user", where, data });
          return {};
        });
        mockPrisma.profile.updateMany.mockImplementation(({ data }) => {
          updateCalls.push({ model: "profile", data });
          return { count: 2 };
        });
        mockPrisma.exclusivePartnership.update.mockImplementation(({ data }) => {
          updateCalls.push({ model: "partnership", data });
          return {};
        });
        return await fn(mockPrisma);
      });

      await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/approve`)
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`)
        .send({ adminNote: "Approved!" });

      // Verify both users updated with isMarried: true
      const userUpdates = updateCalls.filter((c) => c.model === "user");
      expect(userUpdates).toHaveLength(2);
      expect(userUpdates[0].data.isMarried).toBe(true);
      expect(userUpdates[0].data.marriedAt).toBeInstanceOf(Date);
      expect(userUpdates[1].data.isMarried).toBe(true);

      // Verify partnership ended
      const partnershipUpdate = updateCalls.find((c) => c.model === "partnership");
      expect(partnershipUpdate.data.status).toBe("ended");
      expect(partnershipUpdate.data.endedAt).toBeInstanceOf(Date);

      // Verify profiles updated to maritalStatus: married
      const profileUpdate = updateCalls.find((c) => c.model === "profile");
      expect(profileUpdate.data.maritalStatus).toBe("married");

      // Verify submission status updated
      const submissionUpdate = updateCalls.find((c) => c.model === "marriageSuccess");
      expect(submissionUpdate.data.status).toBe("approved");
      expect(submissionUpdate.data.adminId).toBe(ADMIN_ID);
    });
  });

  // ============================================================
  // 11. Archive Account works correctly
  // ============================================================
  describe("11. Archive account", () => {
    it("should set isActive to false for married user", async () => {
      mockAuthedUser(USER_A, "user", { isMarried: true });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.profile.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app)
        .post("/api/marriage-success/archive-account")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_A },
          data: { isActive: false },
        })
      );
    });

    it("should return 403 for non-married user", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .post("/api/marriage-success/archive-account")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });
  });

  // ============================================================
  // 12. Permanent Delete requires password + OTP
  // ============================================================
  describe("12. Permanent delete account", () => {
    it("Step 1: should verify password and generate OTP", async () => {
      const passwordHash = await bcrypt.hash("Test1234!", 10);
      mockAuthedUser(USER_A, "user", { isMarried: true, passwordHash });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/marriage-success/delete-account/verify-password")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ password: "Test1234!" });

      expect(res.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phoneOtp: expect.stringMatching(/^\d{6}$/),
            phoneOtpExpiry: expect.any(Date),
          }),
        })
      );
    });

    it("Step 1: should reject wrong password", async () => {
      const passwordHash = await bcrypt.hash("Correct123!", 10);
      mockAuthedUser(USER_A, "user", { isMarried: true, passwordHash });

      const res = await request(app)
        .post("/api/marriage-success/delete-account/verify-password")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ password: "WrongPassword!" });

      expect(res.status).toBe(401);
    });

    it("Step 2: should delete account with valid OTP", async () => {
      mockAuthedUser(USER_A, "user", { isMarried: true, phoneOtp: "123456", phoneOtpExpiry: new Date(Date.now() + 600000) });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/marriage-success/delete-account/confirm")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ otp: "123456" });

      expect(res.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDeleted: true,
            deletedAt: expect.any(Date),
            isActive: false,
          }),
        })
      );
    });

    it("Step 2: should reject invalid OTP", async () => {
      mockAuthedUser(USER_A, "user", { isMarried: true, phoneOtp: "123456", phoneOtpExpiry: new Date(Date.now() + 600000) });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/marriage-success/delete-account/confirm")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ otp: "999999" });

      expect(res.status).toBe(401);
    });

    it("Step 2: should reject expired OTP", async () => {
      mockAuthedUser(USER_A, "user", { isMarried: true, phoneOtp: "123456", phoneOtpExpiry: new Date(Date.now() - 60000) });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await request(app)
        .post("/api/marriage-success/delete-account/confirm")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ otp: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("expired");
    });

    it("Step 2: should return 403 for non-married user", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .post("/api/marriage-success/delete-account/confirm")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`)
        .send({ otp: "123456" });

      expect(res.status).toBe(403);
    });
  });

  // ============================================================
  // 13. Cancel submission (simulates partnership ending before approval)
  // ============================================================
  describe("13. Cancel marriage success submission", () => {
    it("should cancel submission in pending_partner_confirm stage", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "pending_partner_confirm",
      });
      mockPrisma.marriageSuccess.delete.mockResolvedValue({});

      const res = await request(app)
        .delete(`/api/marriage-success/${SUBMISSION_ID}`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(200);
      expect(mockPrisma.marriageSuccess.delete).toHaveBeenCalledWith({ where: { id: SUBMISSION_ID } });
    });

    it("should not cancel if already approved", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        initiatorId: USER_A,
        partnerId: USER_B,
        status: "approved",
      });

      const res = await request(app)
        .delete(`/api/marriage-success/${SUBMISSION_ID}`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 14. Users cannot submit duplicate marriage requests
  // ============================================================
  describe("14. Duplicate prevention", () => {
    it("should return 403 if a non-rejected submission already exists", async () => {
      mockAuthedUser(USER_A);
      mockActivePartnership();
      mockUsersNotMarried();
      mockPrisma.marriageSuccess.findFirst.mockResolvedValue({
        id: "existing-submission",
        status: "pending_partner_confirm",
      });

      const res = await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("already exists");
    });

    it("should allow new request if previous one was rejected", async () => {
      mockAuthedUser(USER_A);
      mockActivePartnership();
      mockUsersNotMarried();
      mockPrisma.marriageSuccess.findFirst.mockResolvedValue(null);
      mockPrisma.marriageSuccess.create.mockResolvedValue({
        id: "new-submission",
        status: "pending_partner_confirm",
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: USER_A, role: "user", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: null })
        .mockResolvedValueOnce({ id: USER_A, firstName: "John", lastName: "Doe" });

      const res = await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(201);
    });

    it("should return 403 if either user is already married", async () => {
      mockAuthedUser(USER_A);
      mockActivePartnership();
      mockPrisma.marriageSuccess.findFirst.mockResolvedValue(null);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: USER_A, isMarried: false },
        { id: USER_B, isMarried: true }, // already married
      ]);

      const res = await request(app)
        .post("/api/marriage-success/request")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("already marked as married");
    });
  });

  // ============================================================
  // 15. Only admins can access Marriage Success admin page
  // ============================================================
  describe("15. Admin-only access control", () => {
    it("should allow admin to access admin submissions", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/marriage-success/admin/submissions")
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`);

      expect(res.status).toBe(200);
    });

    it("should deny regular user access to admin submissions", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .get("/api/marriage-success/admin/submissions")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });

    it("should deny regular user from approving submissions", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/approve`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });

    it("should deny regular user from rejecting submissions", async () => {
      mockAuthedUser(USER_A);

      const res = await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/reject`)
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(403);
    });

    it("should deny unauthenticated access to admin submissions", async () => {
      const res = await request(app)
        .get("/api/marriage-success/admin/submissions");

      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // Additional: Admin reject submission
  // ============================================================
  describe("Admin rejects submission", () => {
    it("should return 200 and mark submission as rejected", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: "admin", isActive: true, tokenVersion: 0, deletedAt: null, isDeleted: false, adminRole: "admin" });
      mockPrisma.marriageSuccess.findUnique.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "pending_admin_review",
        initiatorId: USER_A,
        partnerId: USER_B,
      });
      mockPrisma.marriageSuccess.update.mockResolvedValue({
        id: SUBMISSION_ID,
        status: "rejected",
        adminNote: "Photos not clear",
      });

      const res = await request(app)
        .post(`/api/marriage-success/admin/submissions/${SUBMISSION_ID}/reject`)
        .set("Authorization", `Bearer ${makeToken(ADMIN_ID, "admin")}`)
        .send({ adminNote: "Photos not clear" });

      expect(res.status).toBe(200);
      expect(res.body.submission.status).toBe("rejected");
    });
  });

  // ============================================================
  // Additional: Public success stories
  // ============================================================
  describe("Public success stories", () => {
    it("should return published stories without auth", async () => {
      mockPrisma.marriageSuccess.findMany.mockResolvedValue([
        {
          id: "story-1",
          weddingPhotos: ["/uploads/marriage-photos/w1.jpg"],
          successStory: "Our beautiful story",
          createdAt: new Date(),
          initiator: { firstName: "John", lastName: "Doe" },
          partner: { firstName: "Jane", lastName: "Doe" },
        },
      ]);
      mockPrisma.marriageSuccess.count.mockResolvedValue(1);

      const res = await request(app)
        .get("/api/marriage-success/public/stories");

      expect(res.status).toBe(200);
      expect(res.body.stories).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it("should only return approved stories with consent and successStory", async () => {
      mockPrisma.marriageSuccess.findMany.mockResolvedValue([]);
      mockPrisma.marriageSuccess.count.mockResolvedValue(0);

      await request(app).get("/api/marriage-success/public/stories");

      expect(mockPrisma.marriageSuccess.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "approved",
            consentToPublish: true,
            successStory: { not: null },
          }),
        })
      );
    });
  });

  // ============================================================
  // Additional: Get my marriage success submissions
  // ============================================================
  describe("Get my submissions", () => {
    it("should return submissions where user is initiator or partner", async () => {
      mockAuthedUser(USER_A);
      mockPrisma.marriageSuccess.findMany.mockResolvedValue([
        { id: SUBMISSION_ID, initiatorId: USER_A, status: "approved" },
      ]);

      const res = await request(app)
        .get("/api/marriage-success/mine")
        .set("Authorization", `Bearer ${makeToken(USER_A)}`);

      expect(res.status).toBe(200);
      expect(res.body.submissions).toHaveLength(1);
    });
  });
});
