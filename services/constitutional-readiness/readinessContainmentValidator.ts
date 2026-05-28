import type { ConstitutionalReadinessInput, ReadinessError } from "@/types/constitutional-readiness";

export function validateReadinessContainment(input: ConstitutionalReadinessInput): readonly ReadinessError[] {
  const errors: ReadinessError[] = [];
  if (input.adversarialTelemetryResult.record.failClosed) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_CONTAINMENT_DEGRADED",
      message: "Inherited fail-closed containment state blocks permissive readiness scoring.",
      path: "adversarialTelemetryResult.record.failClosed",
    }));
  }
  if (input.adversarialTelemetryResult.containmentPressure.freezeRecommended) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_CONTAINMENT_FREEZE_REQUIRED",
      message: "Containment pressure requires a frozen readiness result.",
      path: "adversarialTelemetryResult.containmentPressure.freezeRecommended",
    }));
  }
  return Object.freeze(errors);
}
