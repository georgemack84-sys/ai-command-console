import crypto from "node:crypto";

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = stableNormalize((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }
  return value;
}

export function stableSerializeSamValue(value: unknown): string {
  return JSON.stringify(stableNormalize(value));
}

export function hashSamValue(value: unknown): string {
  return crypto.createHash("sha256").update(stableSerializeSamValue(value)).digest("hex");
}

export function hashSamProposal(proposal: Record<string, unknown>): string {
  return hashSamValue(proposal);
}
