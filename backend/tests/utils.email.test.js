const nodemailer = require("nodemailer");
const { sendEmail, sendPasswordResetEmail, sendOtpEmail, sendNotificationEmail, send2FAAlertEmail } = require("../src/utils/email");

jest.mock("nodemailer");

const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

const OLD_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  process.env = { ...OLD_ENV };
  process.env.SMTP_HOST = "smtp.test.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_USER = "user@test.com";
  process.env.SMTP_PASS = "secret";
  process.env.EMAIL_FROM = "noreply@test.com";
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("sendEmail", () => {
  it("creates transporter with correct SMTP config", async () => {
    await sendEmail({
      to: "recipient@test.com",
      subject: "Test Subject",
      text: "Hello",
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.test.com",
        port: 587,
        auth: { user: "user@test.com", pass: "secret" },
      })
    );
  });

  it("sends email with correct parameters", async () => {
    await sendEmail({
      to: "recipient@test.com",
      subject: "Welcome!",
      text: "Hello world",
      html: "<p>Hello world</p>",
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "noreply@test.com",
      to: "recipient@test.com",
      subject: "Welcome!",
      text: "Hello world",
      html: "<p>Hello world</p>",
    });
  });

  it("sends email with auto-generated html when only text provided", async () => {
    await sendEmail({
      to: "recipient@test.com",
      subject: "Plain Text",
      text: "Only text",
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "noreply@test.com",
      to: "recipient@test.com",
      subject: "Plain Text",
      text: "Only text",
      html: "<p>Only text</p>",
    });
  });

  it("uses SMTP_PORT as number", async () => {
    await sendEmail({
      to: "recipient@test.com",
      subject: "Test",
      text: "Test",
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587 })
    );
  });

  it("handles send failure gracefully by throwing", async () => {
    mockSendMail.mockRejectedValue(new Error("Connection refused"));
    await expect(
      sendEmail({ to: "test@test.com", subject: "Fail", text: "Fail" })
    ).rejects.toThrow("Connection refused");
  });

  it("resolves successfully when email is sent", async () => {
    mockSendMail.mockResolvedValue({ messageId: "abc123" });
    await expect(
      sendEmail({ to: "test@test.com", subject: "OK", text: "OK" })
    ).resolves.toBeUndefined();
  });
});

describe("sendPasswordResetEmail", () => {
  it("sends a password reset email with a reset link", async () => {
    await sendPasswordResetEmail("user@test.com", "John", "http://localhost:3000/reset-password?token=abc");
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: expect.stringContaining("Password Reset"),
      })
    );
  });
});

describe("sendOtpEmail", () => {
  it("sends an OTP email with the code", async () => {
    await sendOtpEmail("user@test.com", "John", "123456", "phone");
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: expect.stringContaining("Verification Code"),
      })
    );
  });
});

describe("sendNotificationEmail", () => {
  it("sends a notification email", async () => {
    await sendNotificationEmail("user@test.com", "John", "New Like!", "Someone liked your profile");
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: expect.stringContaining("New Like!"),
      })
    );
  });
});

describe("send2FAAlertEmail", () => {
  it("sends a 2FA alert email", async () => {
    await send2FAAlertEmail("user@test.com", "John", "enabled");
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: expect.stringContaining("2FA"),
      })
    );
  });
});
