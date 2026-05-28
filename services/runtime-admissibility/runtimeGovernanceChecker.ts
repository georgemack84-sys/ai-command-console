import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
  RuntimeGovernanceCheck,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function checkRuntimeGovernanceCompatibility(input: RuntimeAdmissibilityInput): Readonly<{
  governanceCheck: RuntimeGovernanceCheck;
  errors: readonly RuntimeAdmissibilityError[];
}> {
  const governanceSnapshotId = input.constitutionalReplayResult.record.governanceSnapshotId;
  const detached = governanceSnapshotId !== input.runtimeTopology.governanceSnapshotId;
  const driftDetected = detached || !input.constitutionalAuthorityBoundaryResult.record.governanceBound;
  const errors: RuntimeAdmissibilityError[] = [];
  if (detached) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_GOVERNANCE_DETACHED",
      message: "Runtime topology is detached from the immutable governance snapshot.",
      path: "runtimeTopology.governanceSnapshotId",
    }));
  }
  if (driftDetected) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_GOVERNANCE_MISMATCH",
      message: "Runtime admissibility detected governance drift or ambiguity.",
      path: "constitutionalAuthorityBoundaryResult.record.governanceBound",
    }));
  }
  return Object.freeze({
    governanceCheck: Object.freeze({
      governanceSnapshotId,
      detached,
      driftDetected,
      governanceBound: !detached && !driftDetected,
      deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-governance", {
        governanceSnapshotId,
        detached,
        driftDetected,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
