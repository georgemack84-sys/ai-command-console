import crypto from "node:crypto";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`);
  return `{${entries.join(",")}}`;
}

export function stableSerializeEvidence(value: unknown) {
  return stableSerialize(value);
}

export function hashEvidence(value: unknown) {
  return crypto.createHash("sha256").update(stableSerialize(value)).digest("hex");
}

export function verifyEvidenceHash(value: unknown, expectedHash: string) {
  return hashEvidence(value) === expectedHash;
}
