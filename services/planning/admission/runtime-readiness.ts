import { createAdmissionFailure } from "./admission-errors";
import type { AdmissionBuildInput, AdmissionRuntimeReadiness } from "./admission-types";

export function evaluateRuntimeReadiness(input: AdmissionBuildInput): AdmissionRuntimeReadiness {
  const failures = [];
  const warnings = [];

  if (!input.runtimeMetadata.runtimeSnapshotHash) {
    failures.push(createAdmissionFailure("PHASE42L_CONTEXT_MISSING", "Runtime snapshot hash is required for admission readiness.", "runtimeMetadata.runtimeSnapshotHash"));
  }
  if (input.runtimeMetadata.mutationAttempted) {
    failures.push(createAdmissionFailure("PHASE42L_MUTATION_ATTEMPT_BLOCKED", "Runtime mutation attempt detected during admission evaluation.", "runtimeMetadata.mutationAttempted"));
  }
  if (input.runtimeMetadata.stale) {
    failures.push(createAdmissionFailure("PHASE42L_RUNTIME_DRIFT", "Runtime snapshot is stale.", "runtimeMetadata.stale"));
  }
  if (input.runtimeMetadata.lockConflict || input.runtimeMetadata.leaseConflict) {
    failures.push(createAdmissionFailure("PHASE42L_RUNTIME_DRIFT", "Runtime lock or lease conflict detected.", "runtimeMetadata"));
  }
  if (!input.runtimeMetadata.healthy) {
    warnings.push("Runtime metadata reports an unhealthy environment.");
  }
  if (
    input.runtimeMetadata.expectedGovernanceEpoch
    && input.runtimeMetadata.governanceEpoch
    && input.runtimeMetadata.expectedGovernanceEpoch !== input.runtimeMetadata.governanceEpoch
  ) {
    failures.push(createAdmissionFailure("PHASE42L_REVALIDATION_REQUIRED", "Governance epoch mismatch requires revalidation.", "runtimeMetadata.governanceEpoch"));
  }

  return {
    ready: failures.length === 0 && input.runtimeMetadata.healthy,
    shouldPause: Boolean(input.runtimeMetadata.stale || !input.runtimeMetadata.healthy || input.runtimeMetadata.lockConflict || input.runtimeMetadata.leaseConflict),
    requiresRevalidation: failures.some((failure) => failure.code === "PHASE42L_REVALIDATION_REQUIRED"),
    failures,
    warnings,
  };
}
