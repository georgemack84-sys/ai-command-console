import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../../core";
import type { OwnershipContract, OwnershipValidationResult } from "../contracts/ownershipContract";
import { generateOwnershipHash } from "../hashing/ownershipHashGenerator";
import { validateOwnerId } from "./ownerValidator";
import { validateTenantId } from "./tenantValidator";

export function validateOwnershipContract(
  ownership: Partial<OwnershipContract> & Record<string, unknown>,
): OwnershipValidationResult {
  const reasons: string[] = [];

  for (const field of ["ownership_hash", "owner_id", "tenant_id", "source_id", "market_id", "timestamp", "version"] as const) {
    if (ownership[field] === null) reasons.push(`${field} cannot be null`);
    if (ownership[field] === undefined) reasons.push(`${field} is required`);
    if (typeof ownership[field] === "string" && ownership[field].trim() === "") reasons.push(`${field} cannot be empty`);
  }

  reasons.push(...validateOwnerId(ownership.owner_id).reasons);
  reasons.push(...validateTenantId(ownership.tenant_id).reasons);

  if (!isNonEmptyString(ownership.source_id)) reasons.push("source_id is required");
  if (!isNonEmptyString(ownership.market_id)) reasons.push("market_id is required");
  if (!isValidTimestamp(ownership.timestamp)) reasons.push("timestamp is required and must be valid");
  if (!isValidVersion(ownership.version)) reasons.push("version is required and must be valid");

  if (
    isNonEmptyString(ownership.owner_id) &&
    isNonEmptyString(ownership.tenant_id) &&
    isNonEmptyString(ownership.source_id) &&
    isNonEmptyString(ownership.market_id) &&
    isValidTimestamp(ownership.timestamp) &&
    isValidVersion(ownership.version) &&
    isNonEmptyString(ownership.ownership_hash)
  ) {
    const expectedHash = generateOwnershipHash({
      owner_id: ownership.owner_id,
      tenant_id: ownership.tenant_id,
      source_id: ownership.source_id,
      market_id: ownership.market_id,
      timestamp: ownership.timestamp,
      version: ownership.version,
    });

    if (ownership.ownership_hash !== expectedHash) {
      reasons.push("ownership_hash does not match reproducible ownership hash");
    }
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons: Array.from(new Set(reasons)) };
}
