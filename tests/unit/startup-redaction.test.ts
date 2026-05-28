import { describe, expect, it } from "vitest";

import { redactConfig } from "@/services/startup/redactConfig";
import { sanitizeStartupError } from "@/services/startup/logSanitizer";

describe("startup redaction", () => {
  it("redacts secrets from config output", () => {
    const redacted = redactConfig({
      DATABASE_URL: "postgres://secret@db",
      ADMIN_SECRET: "super-secret",
      JWT_SECRET: "jwt-secret",
    });

    expect(redacted.DATABASE_URL).toBe("[REDACTED]");
    expect(redacted.ADMIN_SECRET).toBe("[REDACTED]");
    expect(redacted.JWT_SECRET).toBe("[REDACTED]");
  });

  it("sanitizes stack traces and telemetry payloads", () => {
    const sanitized = sanitizeStartupError({
      message: "DATABASE_URL leaked",
      stack: "ADMIN_SECRET=super-secret",
      context: { apiKey: "abc123" },
    });

    expect(String(sanitized.stack)).not.toContain("super-secret");
    expect(JSON.stringify(sanitized.context)).not.toContain("abc123");
  });
});
