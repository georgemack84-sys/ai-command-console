import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const accessCookieName = "household-manager-access";
const maxAgeSeconds = 60 * 60 * 24 * 14;

function pin() { return process.env.HOUSEHOLD_ACCESS_PIN?.trim() ?? ""; }
function secret() { return process.env.HOUSEHOLD_SESSION_SECRET?.trim() || pin(); }
function signature(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function accessProtectionEnabled() { return Boolean(pin()); }

export function validPin(candidate: unknown) {
  if (typeof candidate !== "string" || !accessProtectionEnabled()) return false;
  const expected = Buffer.from(pin()); const supplied = Buffer.from(candidate);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createAccessToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  return { value: `${expiresAt}.${signature(String(expiresAt))}`, maxAge: maxAgeSeconds };
}

export function hasAccess(cookieHeader: string | null) {
  if (!accessProtectionEnabled()) return true;
  const value = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${accessCookieName}=`))?.slice(accessCookieName.length + 1);
  if (!value) return false;
  const [expiresAt, tokenSignature] = value.split(".");
  if (!expiresAt || !tokenSignature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signature(expiresAt)); const supplied = Buffer.from(tokenSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function requireHouseholdAccess(request: Request) {
  return hasAccess(request.headers.get("cookie")) ? null : Response.json({ error: "Unlock the household to continue." }, { status: 401 });
}
