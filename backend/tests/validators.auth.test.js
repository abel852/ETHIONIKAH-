const { registerSchema, loginSchema, validate } = require("../src/validators/auth");

describe("registerSchema", () => {
  const validData = {
    email: "test@example.com",
    phone: "+251911000000",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    gender: "male",
    dateOfBirth: "1995-06-15",
  };

  it("passes with valid data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.firstName).toBe("John");
      expect(result.data.lastName).toBe("Doe");
      expect(result.data.gender).toBe("male");
    }
  });

  it("sanitizes phone number by removing spaces, dashes, and parens", () => {
    const result = registerSchema.safeParse({
      ...validData,
      phone: "+251 911-000-(000)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+251911000000");
    }
  });

  it("fails with invalid email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("email");
    }
  });

  it("fails with empty email", () => {
    const result = registerSchema.safeParse({ ...validData, email: "" });
    expect(result.success).toBe(false);
  });

  it("fails with short password (less than 8 chars)", () => {
    const result = registerSchema.safeParse({ ...validData, password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("password");
    }
  });

  it("fails with invalid phone number", () => {
    const result = registerSchema.safeParse({ ...validData, phone: "abc" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path[0]);
      expect(paths).toContain("phone");
    }
  });

  it("fails with invalid gender", () => {
    const result = registerSchema.safeParse({ ...validData, gender: "other" });
    expect(result.success).toBe(false);
  });

  it("fails with invalid date format", () => {
    const result = registerSchema.safeParse({ ...validData, dateOfBirth: "15-06-1995" });
    expect(result.success).toBe(false);
  });

  it("fails with short firstName (less than 2 chars)", () => {
    const result = registerSchema.safeParse({ ...validData, firstName: "A" });
    expect(result.success).toBe(false);
  });

  it("fails with missing required fields", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("passes with valid email and password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("fails with empty password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("fails with missing fields", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("validate middleware", () => {
  function mockReqRes(body) {
    const req = { body };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it("returns 400 with validation errors when data is invalid", () => {
    const { req, res, next } = mockReqRes({ email: "bad", password: "" });
    validate(loginSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ errors: expect.any(Array) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and sets req.validatedBody when data is valid", () => {
    const { req, res, next } = mockReqRes({ email: "test@example.com", password: "secret" });
    validate(loginSchema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.validatedBody).toEqual({ email: "test@example.com", password: "secret" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 400 with Zod error details", () => {
    const { req, res, next } = mockReqRes({ email: "", password: "" });
    validate(loginSchema)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.errors).toBeInstanceOf(Array);
    expect(callArg.errors.length).toBeGreaterThan(0);
  });
});
