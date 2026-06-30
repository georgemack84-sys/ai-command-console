import { isNonEmptyString } from "../../../core";
import type { MarketObservation } from "../../markets";
import { validateOwnershipContract, type OwnershipContract } from "../../ownership";
import type { StageVerificationResult } from "../records/verificationResult";

export function verifyObservationOwnership(
  observation: Partial<MarketObservation> & Record<string, unknown>,
  ownership?: Partial<OwnershipContract> & Record<string, unknown>,
): StageVerificationResult {
  if (!isNonEmptyString(observation.ownership_hash)) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_HASH_MISSING" };
  }

  if (!ownership) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_MISSING" };
  }

  if (Object.values(ownership).some((value) => value === null)) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_NULLABLE" };
  }

  if (ownership.inherited_from || ownership.inherited_ownership || ownership.ownership_inheritance) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_INHERITED" };
  }

  if (!isNonEmptyString(ownership.owner_id)) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNER_MISSING" };
  }

  if (!isNonEmptyString(ownership.tenant_id)) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "TENANT_MISSING" };
  }

  if (ownership.source_id !== observation.source_id || ownership.market_id !== observation.market_id) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_HASH_MISMATCH" };
  }

  const validation = validateOwnershipContract(ownership);
  if (validation.status === "REJECTED") {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_HASH_MISMATCH" };
  }

  if (ownership.ownership_hash !== observation.ownership_hash) {
    return { status: "FAILED", failed_stage: "OWNERSHIP_VALIDATION", failure_reason: "OWNERSHIP_HASH_MISMATCH" };
  }

  return { status: "PASSED" };
}
