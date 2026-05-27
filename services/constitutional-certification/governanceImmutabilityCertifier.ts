import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  GovernanceImmutabilityRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyGovernanceImmutability(input: ConstitutionalCertificationInput): {
  record: GovernanceImmutabilityRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const immutable =
    input.constitutionalReadinessResult.governanceIntegrity.governanceBound
    && !input.constitutionalReadinessResult.governanceIntegrity.staleGovernanceDetected
    && input.runtimeAdmissibilityResult.governanceCheck.governanceBound
    && !input.runtimeAdmissibilityResult.governanceCheck.detached
    && !input.runtimeAdmissibilityResult.governanceCheck.driftDetected;
  const score = immutable ? 1 : 0.1;
  const errors: ConstitutionalCertificationError[] = [];
  if (!immutable) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_AMBIGUITY",
      message: "Governance immutability could not be certified.",
      path: "governance",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      immutable,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-governance-immutability", {
        governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
        immutable,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
