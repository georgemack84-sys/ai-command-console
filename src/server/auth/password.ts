import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function createPasswordHash(password: string) {
  const salt = randomUUID();
  return `${salt}:${hashPassword(password, salt)}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const attempted = Buffer.from(hashPassword(password, salt), "hex");
  const stored = Buffer.from(hash, "hex");
  return attempted.length === stored.length && timingSafeEqual(attempted, stored);
}
