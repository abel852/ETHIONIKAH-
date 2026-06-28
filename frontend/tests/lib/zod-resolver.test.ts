import { z } from "zod";
import { zodResolver } from "@/lib/zod-resolver";

describe("zodResolver", () => {
  it("returns values on success", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const resolver = zodResolver(schema);
    const result = await resolver({ name: "John", age: 30 });
    expect(result.values).toEqual({ name: "John", age: 30 });
    expect(result.errors).toEqual({});
  });

  it("returns errors on failure", async () => {
    const schema = z.object({ name: z.string().min(3), age: z.number().min(18) });
    const resolver = zodResolver(schema);
    const result = await resolver({ name: "JD", age: 10 });
    expect(result.values).toEqual({});
    expect(result.errors).toHaveProperty("name");
    expect(result.errors).toHaveProperty("age");
  });

  it("handles nested paths", async () => {
    const schema = z.object({
      user: z.object({
        address: z.object({
          city: z.string().min(2),
        }),
      }),
    });
    const resolver = zodResolver(schema);
    const result = await resolver({ user: { address: { city: "X" } } });
    expect(result.values).toEqual({});
    expect(result.errors).toHaveProperty("user");
    if (result.errors.user) {
      const userErr = result.errors.user as any;
      expect(userErr).toHaveProperty("address");
      expect((userErr.address as any).city).toBeDefined();
    }
  });

  it("returns errors with type field", async () => {
    const schema = z.object({ email: z.string().email() });
    const resolver = zodResolver(schema);
    const result = await resolver({ email: "invalid" });
    expect(result.errors.email).toBeDefined();
    expect(result.errors.email.type).toBeDefined();
  });

  it("returns errors with message field", async () => {
    const schema = z.object({ email: z.string().email("Must be a valid email") });
    const resolver = zodResolver(schema);
    const result = await resolver({ email: "invalid" });
    expect(result.errors.email).toBeDefined();
    expect(result.errors.email.message).toContain("valid email");
  });

  it("passes through unknown keys", async () => {
    const schema = z.object({ name: z.string() });
    const resolver = zodResolver(schema);
    const result = await resolver({ name: "John", extra: "ignored" });
    expect(result.values).toEqual({ name: "John" });
  });
});
