import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "@/src/server/auth/session-token";

describe("session token", () => {
  it("round-trips a valid signed payload", () => {
    const token = createSessionToken({
      sessionId: "session_123",
      userId: "user_123",
      expiresAt: "2026-04-05T00:00:00.000Z",
    });

    expect(readSessionToken(token)).toEqual({
      sessionId: "session_123",
      userId: "user_123",
      expiresAt: "2026-04-05T00:00:00.000Z",
    });
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken({
      sessionId: "session_123",
      userId: "user_123",
      expiresAt: "2026-04-05T00:00:00.000Z",
    });
    const [encoded] = token.split(".");

    expect(readSessionToken(`tampered${encoded}.${token.split(".")[1]}`)).toBeNull();
  });
});
