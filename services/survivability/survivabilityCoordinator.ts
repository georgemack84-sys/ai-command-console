import type { ConstitutionalSurvivabilityAssessment } from "./constitutionalSurvivabilityFramework";
import type { OperationalContainmentAssessment } from "../containment/operationalContainment";
import { buildSurvivabilityRoute } from "./survivabilityRouting";
import { buildSurvivabilityAuditRecord } from "./survivabilityAudit";
import { buildSurvivabilityTelemetry } from "./survivabilityTelemetry";

export function coordinateSurvivability(input: {
  assessment: ConstitutionalSurvivabilityAssessment;
  containment: OperationalContainmentAssessment;
  blockedReasons: string[];
  timestamp: string;
}) {
  return {
    route: buildSurvivabilityRoute({
      recommendedAction: input.containment.recommendedAction,
      disputed: input.assessment.survivabilityState === "DISPUTED",
      freezeActive: input.assessment.survivabilityState === "FROZEN",
    }),
    auditRecord: buildSurvivabilityAuditRecord({
      survivabilityState: input.assessment.survivabilityState,
      recommendedAction: input.containment.recommendedAction,
      isolatedDomains: input.containment.isolatedDomains,
      blockedReasons: input.blockedReasons,
      timestamp: input.timestamp,
    }),
    telemetry: buildSurvivabilityTelemetry({
      survivabilityState: input.assessment.survivabilityState,
      systemicInstability: input.assessment.systemicInstability,
      governanceContinuity: input.assessment.governanceContinuity,
      containmentEffectiveness: input.assessment.containmentEffectiveness,
      auditPreservationConfidence: input.assessment.auditPreservationConfidence,
      tenantSurvivabilityRisk: input.containment.tenantSurvivabilityRisk,
      timestamp: input.timestamp,
    }),
  };
}
