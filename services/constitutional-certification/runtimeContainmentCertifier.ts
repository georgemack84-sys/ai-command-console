import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  ContainmentCertificationRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyRuntimeContainment(input: ConstitutionalCertificationInput): {
  record: ContainmentCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const containmentStrength = Number((
    (
      input.constitutionalReadinessResult.containmentCertification.score
      + input.constitutionalReadinessResult.humanSupremacyCertification.score
      + input.constitutionalReadinessResult.governanceIntegrity.score
    ) / 3
  ).toFixed(4));
  const autonomyCapabilityGrowth = Number(Math.min(
    1,
    (
      input.constitutionalRuntimeSimulationResult.containmentState.containmentPressureScore
      + input.constitutionalReadinessResult.runtimeCompatibility.score
      + input.constitutionalReadinessResult.uncertaintyPenalty.penalty
    ) / 3,
  ).toFixed(4));
  const strongerThanCapabilityGrowth = containmentStrength > autonomyCapabilityGrowth;
  const contained =
    input.constitutionalReadinessResult.containmentCertification.contained
    && input.runtimeAdmissibilityResult.compatibility.containmentCompatible
    && strongerThanCapabilityGrowth;
  const score = contained ? containmentStrength : Number(Math.max(0, containmentStrength - 0.5).toFixed(4));
  const errors: ConstitutionalCertificationError[] = [];
  if (!contained) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_INSUFFICIENT",
      message: "Containment strength no longer exceeds autonomy capability growth.",
      path: "containmentStrength",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      containmentId: input.constitutionalReadinessResult.record.containmentId,
      contained,
      strongerThanCapabilityGrowth,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-containment", {
        containmentId: input.constitutionalReadinessResult.record.containmentId,
        contained,
        strongerThanCapabilityGrowth,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
