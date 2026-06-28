import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  step1AccountSchema,
} from "@/lib/validations";

describe("validations", () => {
  describe("loginSchema", () => {
    it("passes with valid data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("fails with missing email", () => {
      const result = loginSchema.safeParse({
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("fails with short password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("passes with rememberMe", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("passes with valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("fails with invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("fails with empty email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("passes with valid data", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token-123",
        password: "newPassword123",
        confirmPassword: "newPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("fails when passwords do not match", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token-123",
        password: "newPassword123",
        confirmPassword: "differentPassword",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("fails with short password", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset-token-123",
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });

    it("fails with empty token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "newPassword123",
        confirmPassword: "newPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("step1AccountSchema", () => {
    it("passes with valid data", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        password: "password123",
        confirmPassword: "password123",
        agreeToTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it("fails when passwords do not match", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        password: "password123",
        confirmPassword: "different",
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("fails when terms not agreed", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        password: "password123",
        confirmPassword: "password123",
        agreeToTerms: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("agreeToTerms");
      }
    });

    it("fails with short fullName", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "JD",
        email: "john@example.com",
        phone: "+1234567890",
        password: "password123",
        confirmPassword: "password123",
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it("fails with invalid email", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "invalid",
        phone: "+1234567890",
        password: "password123",
        confirmPassword: "password123",
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it("fails with short phone", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "123",
        password: "password123",
        confirmPassword: "password123",
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });

    it("fails with short password", () => {
      const result = step1AccountSchema.safeParse({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        password: "short",
        confirmPassword: "short",
        agreeToTerms: true,
      });
      expect(result.success).toBe(false);
    });
  });
});
