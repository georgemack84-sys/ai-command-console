import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  RuntimeCompatibilityReadinessRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function scoreRuntimeCompatibility(input: ConstitutionalReadinessInput): {
  record: RuntimeCompatibilityReadinessRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const runtimeCompatible =
    input.runtimeAdmissibilityResult.record.classification === "admissible"
    && input.runtimeAdmissibilityResult.compatibility.governanceCompatible
    && input.runtimeAdmissibilityResult.compatibility.replayCompatible
    && input.runtimeAdmissibilityResult.compatibility.rollbackCompatible
    && input.runtimeAdmissibilityResult.compatibility.escalationCompatible
    && input.runtimeAdmissibilityResult.compatibility.overrideCompatible
    && input.runtimeAdmissibilityResult.compatibility.topologyCompatible
    && input.constitutionalRuntimeSimulationResult.report.executable === false;
  const observabilityCompatible = input.runtimeAdmissibilityResult.compatibility.observabilityCompatible;
  const score = runtimeCompatible && observabilityCompatible ? 1 : runtimeCompatible ? 0.6 : 0.2;

  const errors: ConstitutionalReadinessError[] = [];
  if (!runtimeCompatible || !observabilityCompatible) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_RUNTIME_COMPATIBILITY_UNCERTAIN",
      message: "Runtime compatibility evidence became uncertain or observationally incomplete.",
      path: "runtimeAdmissibilityResult.compatibility",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      admissibilityId: input.runtimeAdmissibilityResult.record.admissibilityId,
      runtimeCompatible,
      observabilityCompatible,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-runtime-compatibility", {
        admissibilityId: input.runtimeAdmissibilityResult.record.admissibilityId,
        runtimeCompatible,
        observabilityCompatible,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
