import { EdgeBookError } from "../../../core";
import type { OwnershipContract } from "../contracts/ownershipContract";

const immutableFields: Array<keyof OwnershipContract> = [
  "ownership_hash",
  "owner_id",
  "tenant_id",
  "source_id",
  "market_id",
  "timestamp",
  "version",
];

export function assertOwnershipImmutable(
  existing: OwnershipContract,
  next: Partial<OwnershipContract> & {
    inherited_from?: unknown;
    inherited_ownership?: unknown;
    ownership_inheritance?: unknown;
  },
): { status: "UNCHANGED"; ownership: OwnershipContract } {
  if (next.inherited_from || next.inherited_ownership || next.ownership_inheritance) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Ownership cannot be inherited silently.", "ownership_hash");
  }

  for (const field of immutableFields) {
    if (next[field] !== undefined && next[field] !== existing[field]) {
      throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", `${field} cannot be changed after ownership creation.`, field);
    }
  }

  return { status: "UNCHANGED", ownership: { ...existing } };
}

export function assertOwnershipReplacementBlocked(
  existing: OwnershipContract,
  replacement: OwnershipContract,
): { status: "UNCHANGED"; ownership: OwnershipContract } {
  if (existing.ownership_hash !== replacement.ownership_hash) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Ownership replacement is prohibited.", "ownership_hash");
  }

  return assertOwnershipImmutable(existing, replacement);
}
