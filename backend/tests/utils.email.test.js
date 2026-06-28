const nodemailer = require("nodemailer");
const { sendEmail } = require("../src/utils/email");

jest.mock("nodemailer");

const mockSendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

const OLD_ENV = process.env;

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.test.com",
      port: 587,
      auth: { user: "user@test.com", pass: "secret" },
    });
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

  it("sends email without html when only text provided", async () => {
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
      html: undefined,
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
