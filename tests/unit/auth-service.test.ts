import { describe, expect, it } from "vitest";
import { createPasswordHash, verifyPassword } from "@/src/server/auth/password";

describe("auth service", () => {
  it("verifies a matching password against a generated hash", () => {
    const hash = createPasswordHash("correct-horse-battery-staple");
    expect(verifyPassword("correct-horse-battery-staple", hash)).toBe(true);
  });

  it("rejects the wrong password", () => {
    const hash = createPasswordHash("correct-horse-battery-staple");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });
});
