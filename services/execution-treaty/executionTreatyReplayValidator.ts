import {
  PRODUCTION_TRUST_ERROR_CODES,
  type ProductionReadinessResult,
} from "@/services/production-trust-framework";

export const EXECUTION_TREATY_ERROR_CODES = {
  HANDOFF_MANIFEST_INVALID: "HANDOFF_MANIFEST_INVALID",
  HANDOFF_HASH_MISMATCH: "HANDOFF_HASH_MISMATCH",
  HANDOFF_REVALIDATION_REQUIRED: "HANDOFF_REVALIDATION_REQUIRED",
  HANDOFF_REVOKED: "HANDOFF_REVOKED",
  HANDOFF_QUARANTINED: "HANDOFF_QUARANTINED",
  EXECUTOR_BOUNDARY_VIOLATION: "EXECUTOR_BOUNDARY_VIOLATION",
  HANDOFF_EVIDENCE_WRITE_FAILED: "HANDOFF_EVIDENCE_WRITE_FAILED",
  HANDOFF_CONSTRAINTS_MISSING: "HANDOFF_CONSTRAINTS_MISSING",
  HANDOFF_REGISTRY_BINDING_MISSING: "HANDOFF_REGISTRY_BINDING_MISSING",
  HANDOFF_APPROVAL_CHAIN_INVALID: "HANDOFF_APPROVAL_CHAIN_INVALID",
  HANDOFF_SIGNATURE_INVALID: "HANDOFF_SIGNATURE_INVALID",
  HANDOFF_PROVENANCE_MISSING: "HANDOFF_PROVENANCE_MISSING",
  HANDOFF_ARCHIVE_FAILED: "HANDOFF_ARCHIVE_FAILED",
  HANDOFF_FORENSIC_REPLAY_INVALID: "HANDOFF_FORENSIC_REPLAY_INVALID",
  HANDOFF_GOVERNANCE_INHERITANCE_INVALID: "HANDOFF_GOVERNANCE_INHERITANCE_INVALID",
  HANDOFF_ZERO_TRUST_ATTESTATION_REQUIRED: "HANDOFF_ZERO_TRUST_ATTESTATION_REQUIRED",
  HANDOFF_RUNTIME_AUTHORITY_DETECTED: "HANDOFF_RUNTIME_AUTHORITY_DETECTED",
  HANDOFF_EXECUTION_BEHAVIOR_DETECTED: "HANDOFF_EXECUTION_BEHAVIOR_DETECTED",
} as const;

export type ExecutionTreatyErrorCode =
  typeof EXECUTION_TREATY_ERROR_CODES[keyof typeof EXECUTION_TREATY_ERROR_CODES];

export type ExecutionTreatyFailure = Readonly<{
  code: ExecutionTreatyErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type ExecutionTreatyValidationResult = Readonly<{
  valid: boolean;
  failures: readonly ExecutionTreatyFailure[];
}>;

export function validateTreatyReplayBindings(input: {
  readiness: ProductionReadinessResult;
  replaySnapshotHash: string;
  replayBindingHash: string;
  liveRegistryFallbackDetected?: boolean;
  currentReplaySnapshotHash?: string;
  currentReplayBindingHash?: string;
}): ExecutionTreatyValidationResult {
  const failures: ExecutionTreatyFailure[] = [];
  if (!input.readiness.replayVerified) {
    failures.push({
      code: EXECUTION_TREATY_ERROR_CODES.HANDOFF_REVALIDATION_REQUIRED,
      message: "production readiness did not verify replay trust",
      path: "readiness.replayVerified",
    });
  }
  if (input.liveRegistryFallbackDetected) {
    failures.push({
      code: EXECUTION_TREATY_ERROR_CODES.HANDOFF_REVALIDATION_REQUIRED,
      message: "live registry fallback is forbidden",
      path: "liveRegistryFallbackDetected",
    });
  }
  if (input.currentReplaySnapshotHash !== undefined && input.currentReplaySnapshotHash !== input.replaySnapshotHash) {
    failures.push({
      code: EXECUTION_TREATY_ERROR_CODES.HANDOFF_HASH_MISMATCH,
      message: "replay snapshot hash drift detected",
      path: "currentReplaySnapshotHash",
      expected: input.replaySnapshotHash,
      actual: input.currentReplaySnapshotHash,
    });
  }
  if (input.currentReplayBindingHash !== undefined && input.currentReplayBindingHash !== input.replayBindingHash) {
    failures.push({
      code: EXECUTION_TREATY_ERROR_CODES.HANDOFF_HASH_MISMATCH,
      message: "replay binding hash drift detected",
      path: "currentReplayBindingHash",
      expected: input.replayBindingHash,
      actual: input.currentReplayBindingHash,
    });
  }
  if (input.readiness.errors.some((error) => error.code === PRODUCTION_TRUST_ERROR_CODES.REPLAY_REGISTRY_MISMATCH)) {
    failures.push({
      code: EXECUTION_TREATY_ERROR_CODES.HANDOFF_REVALIDATION_REQUIRED,
      message: "upstream replay registry mismatch already detected",
      path: "readiness.errors",
    });
  }
  return { valid: failures.length === 0, failures };
}
