import { SESSION_COOKIE_NAME, type SessionTokenPayload } from "./session-contract";

export { SESSION_COOKIE_NAME };

const fromBase64Url = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (character) => character.charCodeAt(0));
const fromHex = (value: string) => value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value) ? Uint8Array.from(value.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16))) : null;

/** Edge-safe verification for middleware; server routes retain the Node crypto implementation. */
export async function readEdgeSessionToken(token?: string | null): Promise<SessionTokenPayload | null> {
  if (!token || !process.env.AI_COMMAND_CONSOLE_AUTH_SECRET) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(process.env.AI_COMMAND_CONSOLE_AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signatureBytes = fromHex(signature);
    if (!signatureBytes) return null;
    const verified = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(encoded));
    if (!verified) return null;
    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionTokenPayload;
    return parsed.sessionId && parsed.userId && parsed.expiresAt ? parsed : null;
  } catch {
    return null;
  }
}
