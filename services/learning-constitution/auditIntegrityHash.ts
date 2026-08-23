import { createHash } from "node:crypto";

export const canonicalizeAuditValue = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeAuditValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalizeAuditValue(record[key])}`).join(",")}}`;
};

export const hashAuditEvent = (event: unknown, previousHash?: string): string =>
  createHash("sha256").update(`${previousHash ?? "ROOT"}|${canonicalizeAuditValue(event)}`, "utf8").digest("hex");
