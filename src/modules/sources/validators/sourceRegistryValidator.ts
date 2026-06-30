import { isNonEmptyString, isValidTimestamp, isValidVersion } from "../../../core";
import { createSourceOwnership, validateSourceOwnership } from "../ownership/sourceOwnership";
import type { SourceRegistryObject, SourceValidationResult } from "../schemas/sourceRegistryTypes";
import { isValidSourceStatus, isValidSourceType, isValidTrustLevel } from "../trust/sourceTrust";

export function validateSourceRegistryObject(
  source: Partial<SourceRegistryObject>,
  existingSourceIds: ReadonlySet<string> = new Set(),
): SourceValidationResult {
  const reasons: string[] = [];

  if (!isNonEmptyString(source.source_id)) reasons.push("source_id is required");
  if (!isNonEmptyString(source.source_name)) reasons.push("source_name is required");
  if (!isValidSourceType(source.source_type)) reasons.push("source_type is invalid");
  if (!isValidTrustLevel(source.trust_level)) reasons.push("trust_level is invalid");
  if (!isValidSourceStatus(source.status)) reasons.push("status is invalid");
  if (!isNonEmptyString(source.owner_id)) reasons.push("owner_id is required");
  if (!isNonEmptyString(source.tenant_id)) reasons.push("tenant_id is required");
  if (!isValidTimestamp(source.created_at)) reasons.push("created_at must be a valid timestamp");
  if (!isValidVersion(source.version)) reasons.push("version is required and must be valid");

  if (isNonEmptyString(source.source_name) && source.source_name.trim().toLowerCase() === "anonymous") {
    reasons.push("anonymous sources are invalid");
  }

  if (isNonEmptyString(source.owner_id) && source.owner_id.trim().toLowerCase() === "anonymous") {
    reasons.push("anonymous sources are invalid");
  }

  if (isNonEmptyString(source.source_id) && existingSourceIds.has(source.source_id)) {
    reasons.push("duplicate source_id is rejected");
  }

  if (reasons.length === 0) {
    const ownership = createSourceOwnership(source as SourceRegistryObject);
    const ownershipResult = validateSourceOwnership(ownership);
    reasons.push(...ownershipResult.reasons);
  }

  return { status: reasons.length === 0 ? "VALID" : "REJECTED", reasons };
}
