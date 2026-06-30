import type { SourceRegistryStore } from "../../sources";
import { isNonEmptyString } from "../../../core";
import type { StageVerificationResult } from "../records/verificationResult";

export type SourceVerificationFailureReason =
  | "SOURCE_MISSING"
  | "SOURCE_UNKNOWN"
  | "SOURCE_DISABLED"
  | "SOURCE_BLOCKED"
  | "SOURCE_OWNERLESS";

export function verifySourceRegistration(
  store: SourceRegistryStore,
  sourceId: unknown,
): StageVerificationResult & { failure_reason?: SourceVerificationFailureReason } {
  if (!isNonEmptyString(sourceId)) {
    return { status: "FAILED", failed_stage: "SOURCE_VALIDATION", failure_reason: "SOURCE_MISSING" };
  }

  const source = store.getSourceById(sourceId);
  if (!source) {
    return { status: "FAILED", failed_stage: "SOURCE_VALIDATION", failure_reason: "SOURCE_UNKNOWN" };
  }

  if (source.status === "DISABLED") {
    return { status: "FAILED", failed_stage: "SOURCE_VALIDATION", failure_reason: "SOURCE_DISABLED" };
  }

  if (source.status === "BLOCKED") {
    return { status: "FAILED", failed_stage: "SOURCE_VALIDATION", failure_reason: "SOURCE_BLOCKED" };
  }

  if (!isNonEmptyString(source.owner_id) || !isNonEmptyString(source.tenant_id)) {
    return { status: "FAILED", failed_stage: "SOURCE_VALIDATION", failure_reason: "SOURCE_OWNERLESS" };
  }

  return { status: "PASSED" };
}
