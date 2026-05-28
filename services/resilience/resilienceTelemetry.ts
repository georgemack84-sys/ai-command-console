import type { ConstitutionalResilienceAssessment } from "./constitutionalResilienceEngine";
import type { ContinuityArchitecture } from "./continuityArchitecture";
import type { CollapsePreventionPlan } from "./collapsePrevention";

export function buildResilienceTelemetrySnapshot(input: {
  assessment: ConstitutionalResilienceAssessment;
  continuity: ContinuityArchitecture;
  collapsePrevention: CollapsePreventionPlan;
  createdAt: number;
}) {
  return {
    generatedAt: input.createdAt,
    resilienceState: input.assessment.resilienceState,
    continuityMode: input.continuity.mode,
    collapseRisk: input.collapsePrevention.collapseRisk,
    protectedDomains: input.collapsePrevention.protectedDomains,
    advisoryOnly: true as const,
  };
}
