import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/src/config/env";

export const SESSION_COOKIE_NAME = "ai_command_console_session";

export type SessionTokenPayload = {
  sessionId: string;
  userId: string;
  expiresAt: string;
};

function signPayload(payload: string) {
  return createHmac("sha256", env.AI_COMMAND_CONSOLE_AUTH_SECRET).update(payload).digest("hex");
}

export function createSessionToken(payload: SessionTokenPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function readSessionToken(token?: string | null): SessionTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionTokenPayload;
    return parsed.sessionId && parsed.userId && parsed.expiresAt ? parsed : null;
  } catch {
    return null;
  }
}
