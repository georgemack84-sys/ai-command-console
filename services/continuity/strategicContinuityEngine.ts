import { analyzeContinuityRisk } from "./continuityRiskAnalysis";
import { forecastStrategicContinuity } from "./continuityForecasting";
import { buildContinuityAuditRecord } from "./continuityAudit";
import { modelStrategicSurvivability, type StrategicContinuityAssessment } from "./survivabilityModel";

export function evaluateStrategicContinuity(input: {
  governance: {
    constitutionalState: string;
    governanceConfidence: number;
    escalationRequired: boolean;
    containmentRequired: boolean;
    violations: string[];
  };
  orchestration: {
    orchestrationAuthorized: boolean;
  };
  validation: {
    valid: boolean;
    freezeActivated: boolean;
    containmentActivated: boolean;
    blockedReasons: string[];
  };
  readiness: {
    readinessState: string;
    readinessScore: number;
  };
  simulationForecast: {
    advisoryOnly: true;
    collapseRisk: number;
    containmentPressure: number;
    governanceInstabilityRisk: number;
  };
  timestamp: string;
}): StrategicContinuityAssessment & { auditRecords: ReturnType<typeof buildContinuityAuditRecord>[] } {
  const disputedTruth = input.governance.violations.includes("disputed_truth_detected")
    || input.governance.violations.includes("disputed_truth_blocks_recovery")
    || input.validation.freezeActivated;
  const risk = analyzeContinuityRisk({
    governanceConfidence: input.governance.governanceConfidence,
    containmentConfidence: 1 - input.simulationForecast.containmentPressure,
    escalationPressure: input.governance.escalationRequired ? 0.75 : input.simulationForecast.governanceInstabilityRisk,
    disputedTruth,
    validationBlockedReasons: input.validation.blockedReasons,
  });
  const survivability = modelStrategicSurvivability({
    governanceConfidence: input.governance.governanceConfidence,
    stabilityScore: input.orchestration.orchestrationAuthorized ? 0.76 : 0.32,
    containmentConfidence: 1 - input.simulationForecast.containmentPressure,
    escalationPressure: input.governance.escalationRequired ? 0.75 : input.simulationForecast.governanceInstabilityRisk,
    collapseRisk: Math.max(risk.collapseRisk, input.simulationForecast.collapseRisk),
    dependencyResilience: input.validation.valid ? 0.7 : 0.35,
  });
  const forecast = forecastStrategicContinuity({
    survivabilityScore: survivability.survivabilityScore,
    escalationPressure: input.governance.escalationRequired ? 0.75 : input.simulationForecast.governanceInstabilityRisk,
    governancePressure: 1 - input.governance.governanceConfidence,
    containmentConfidence: 1 - input.simulationForecast.containmentPressure,
    stabilizationConfidence: input.validation.valid ? 0.68 : 0.32,
    disputedTruth,
  });

  const recommendedActions = Array.from(new Set([
    ...forecast.recommendedActions,
    ...(input.validation.freezeActivated ? ["maintain_constitutional_freeze"] : []),
    ...(input.readiness.readinessState !== "SUPERVISED_READY" ? ["operator_review_required"] : []),
  ]));

  return {
    survivable: survivability.survivabilityScore >= 0.55 && forecast.collapseRisk < 0.6 && disputedTruth === false,
    survivabilityScore: survivability.survivabilityScore,
    continuityTrajectory: forecast.continuityTrajectory,
    escalationPressure: forecast.escalationPressure,
    governancePressure: forecast.governancePressure,
    stabilizationConfidence: forecast.stabilizationConfidence,
    collapseRisk: Math.max(forecast.collapseRisk, input.simulationForecast.collapseRisk),
    containmentConfidence: forecast.containmentConfidence,
    recommendedActions,
    timestamp: input.timestamp,
    auditRecords: [
      buildContinuityAuditRecord({
        eventType: "continuity.assessed",
        reasoning: recommendedActions,
        timestamp: input.timestamp,
      }),
      buildContinuityAuditRecord({
        eventType: "continuity.risk.detected",
        reasoning: risk.riskSignals,
        timestamp: input.timestamp,
      }),
    ],
  };
}
