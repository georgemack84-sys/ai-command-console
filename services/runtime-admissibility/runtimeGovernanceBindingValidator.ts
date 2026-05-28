import type {
  RuntimeAdmissibilityError,
  RuntimeAdmissibilityInput,
  RuntimeGovernanceBinding,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function validateRuntimeGovernanceBinding(
  input: RuntimeAdmissibilityInput,
): Readonly<{
  governanceBinding: RuntimeGovernanceBinding;
  errors: readonly RuntimeAdmissibilityError[];
}> {
  const governanceBound = input.constitutionalAuthorityBoundaryResult.record.governanceBound
    && input.constitutionalReplayResult.record.governanceSnapshotId === input.runtimeTopology.governanceSnapshotId;
  const replayBound = input.constitutionalReplayResult.record.replayDeterministic;
  const supremacyBound = input.humanSupremacyResult.record.governanceBound;
  const escalationBound = input.escalationDeterminismResult.record.governanceBound;
  const containmentBound = input.antiEmergenceResult.record.governanceBound;
  const errors: RuntimeAdmissibilityError[] = [];
  if (!(governanceBound && replayBound && supremacyBound && escalationBound && containmentBound)) {
    errors.push(Object.freeze({
      code: "RUNTIME_ADMISSIBILITY_REPLAY_BINDING_INVALID",
      message: "Runtime admissibility requires immutable governance, replay, supremacy, escalation, and containment bindings.",
      path: "runtimeTopology.governanceSnapshotId",
    }));
  }
  return Object.freeze({
    governanceBinding: Object.freeze({
      bindingId: hashRuntimeCertificationValue("runtime-admissibility-binding-id", input.admissibilityId),
      governanceBound,
      replayBound,
      supremacyBound,
      escalationBound,
      containmentBound,
      deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-binding", {
        governanceBound,
        replayBound,
        supremacyBound,
        escalationBound,
        containmentBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
