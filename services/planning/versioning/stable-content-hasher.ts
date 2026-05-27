import crypto from "node:crypto";

import { serializeDeterministically } from "../normalization/deterministic-serializer";
import type { HashDomain } from "./versioning-types";

function normalizeUnicode(value: unknown): unknown {
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeUnicode);
  }
  if (value instanceof Set) {
    return [...value].map(normalizeUnicode).sort((a, b) => String(a).localeCompare(String(b)));
  }
  if (value instanceof Map) {
    return [...value.entries()]
      .map(([key, nested]) => [normalizeUnicode(key), normalizeUnicode(nested)])
      .sort(([left], [right]) => String(left).localeCompare(String(right)));
  }
  if (value && typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error("HASH_CANONICALIZATION_FAILED");
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort((left, right) => left.localeCompare(right))) {
      result[key] = normalizeUnicode((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "undefined") {
    throw new Error("HASH_CANONICALIZATION_FAILED");
  }
  return value;
}

export function hashStableContent(domain: HashDomain, value: unknown): string {
  const serialized = serializeDeterministically(normalizeUnicode(value));
  return crypto.createHash("sha256").update(`${domain}\n${serialized}`, "utf8").digest("hex");
}
