import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../../core";
import type { OwnershipHashInput } from "../contracts/ownershipContract";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
    .join(",")}}`;
}

export function validateOwnershipHashInput(input: Partial<OwnershipHashInput>): { status: "VALID" | "REJECTED"; reasons: string[] } {
  const reasons: string[] = [];

  if (!isNonEmptyString(input.owner_id)) reasons.push("owner_id is required");
  if (!isNonEmptyString(input.tenant_id)) reasons.push("tenant_id is required");
  if (!isNonEmptyString(input.source_id)) reasons.push("source_id is required");
  if (!isNonEmptyString(input.market_id)) reasons.push("market_id is required");
  if (!isValidTimestamp(input.timestamp)) reasons.push("timestamp is required and must be valid");
  if (!isValidVersion(input.version)) reasons.push("version is required and must be valid");

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}

export function generateOwnershipHash(input: OwnershipHashInput): string {
  const validation = validateOwnershipHashInput(input);
  if (validation.status === "REJECTED") {
    throw new Error(validation.reasons.join("; "));
  }

  const canonical = {
    market_id: input.market_id,
    owner_id: input.owner_id,
    source_id: input.source_id,
    tenant_id: input.tenant_id,
    timestamp: input.timestamp,
    version: input.version,
  };
  const serialized = stableStringify(canonical);
  let hash = 0x811c9dc5;

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `own_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
