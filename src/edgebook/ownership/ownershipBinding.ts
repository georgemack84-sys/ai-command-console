import type { OwnershipContract, OwnershipInput } from "./ownershipContract";
import { createOwnershipHash } from "./ownershipHash";

export type OwnershipBindingResult =
  | { status: "VALID"; ownership: OwnershipContract }
  | { status: "REJECTED"; reasons: string[] };

export function bindOwnership(input: OwnershipInput): OwnershipBindingResult {
  const reasons: string[] = [];

  for (const field of ["owner_id", "tenant_id", "source_id", "market_id", "timestamp", "version"] as const) {
    if (!input[field] || input[field].trim() === "") {
      reasons.push(`${field} is required`);
    }
  }

  if (input.timestamp && Number.isNaN(Date.parse(input.timestamp))) {
    reasons.push("timestamp must be parseable");
  }

  if (reasons.length > 0) {
    return { status: "REJECTED", reasons };
  }

  const ownershipPayload = {
    owner_id: input.owner_id,
    tenant_id: input.tenant_id,
    source_id: input.source_id,
    market_id: input.market_id,
    timestamp: input.timestamp,
    version: input.version,
  };

  return {
    status: "VALID",
    ownership: {
      ...ownershipPayload,
      ownership_hash: createOwnershipHash(ownershipPayload),
    },
  };
}
