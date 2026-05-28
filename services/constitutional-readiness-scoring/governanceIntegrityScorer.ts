import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  GovernanceIntegrityRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

function hasMarker(metadata: Readonly<Record<string, unknown>> | undefined, key: string): boolean {
  return metadata?.[key] === true;
}

export function scoreGovernanceIntegrity(input: ConstitutionalReadinessInput): {
  record: GovernanceIntegrityRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const staleGovernanceDetected =
    hasMarker(input.metadata, "staleGovernance")
    || input.constitutionalReplayResult.record.classification !== "STABLE"
    || !input.runtimeAdmissibilityResult.governanceCheck.governanceBound
    || input.runtimeAdmissibilityResult.governanceCheck.driftDetected
    || input.runtimeAdmissibilityResult.governanceCheck.detached;

  const governanceBound =
    input.constitutionalReplayResult.replayBinding.governanceBound
    && input.humanSupremacyResult.record.governanceBound
    && input.escalationDeterminismResult.record.governanceBound
    && input.antiEmergenceResult.record.governanceBound
    && input.runtimeAdmissibilityResult.record.governanceBound;

  const score = staleGovernanceDetected || !governanceBound ? 0.25 : 1;

  const errors: ConstitutionalReadinessError[] = [];
  if (!governanceBound) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_GOVERNANCE_BINDING_INVALID",
      message: "Governance binding detached from constitutional readiness scoring.",
      path: "governanceBound",
    });
  }
  if (staleGovernanceDetected) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_GOVERNANCE_STALE",
      message: "Governance evidence became stale or drifted.",
      path: "constitutionalReplayResult.record.classification",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
      governanceBound,
      staleGovernanceDetected,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-governance-integrity", {
        governanceSnapshotId: input.constitutionalReplayResult.record.governanceSnapshotId,
        governanceBound,
        staleGovernanceDetected,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
