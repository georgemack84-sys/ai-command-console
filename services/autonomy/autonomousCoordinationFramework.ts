import type { StrategicContinuityAssessment } from "../continuity/survivabilityModel";
import { clampMetric } from "../stability/stabilityMetrics";
import { evaluateCoordinationPolicies } from "./coordinationPolicies";
import { routeAutonomousCoordination } from "./coordinationRouter";
import { validateAutonomousCoordination } from "./coordinationValidation";
import { buildAutonomyTelemetry } from "./autonomyTelemetry";

export type AutonomousCoordinationResult = {
  coordinationId: string;
  coordinationState: string;
  approvedActions: string[];
  deniedActions: string[];
  requiredOversight: string[];
  coordinationRisk: number;
  constitutionalSafe: boolean;
  escalationRequired: boolean;
  telemetry: ReturnType<typeof buildAutonomyTelemetry>;
  route: string[];
};

export function runAutonomousCoordinationFramework(input: {
  strategicContinuity: StrategicContinuityAssessment;
  governance: {
    allowed: boolean;
    constitutionalState: string;
    violations: string[];
    escalationRequired: boolean;
    containmentRequired: boolean;
  };
  orchestration: {
    orchestrationAuthorized: boolean;
    locked: boolean;
  };
  validation: {
    valid: boolean;
    freezeActivated: boolean;
    blockedReasons: string[];
  };
  timestamp: string;
}): AutonomousCoordinationResult {
  const constitutionalSafe =
    input.governance.allowed
    && input.validation.valid
    && input.orchestration.orchestrationAuthorized
    && input.orchestration.locked === false
    && input.strategicContinuity.survivable;

  const disputedTruth = input.governance.violations.includes("disputed_truth_detected")
    || input.governance.violations.includes("disputed_truth_blocks_recovery");
  const policies = evaluateCoordinationPolicies({
    constitutionalSafe,
    disputedTruth,
    freezeActive: input.validation.freezeActivated || input.orchestration.locked,
    containmentRequired: input.governance.containmentRequired || input.strategicContinuity.containmentConfidence < 0.55,
    advisoryOnly: true,
  });
  const validation = validateAutonomousCoordination({
    constitutionalSafe,
    survivabilityScore: input.strategicContinuity.survivabilityScore,
    disputedTruth,
    freezeActive: input.validation.freezeActivated || input.orchestration.locked,
    containmentRequired: input.governance.containmentRequired,
  });
  const route = routeAutonomousCoordination({
    coordinationType: policies.coordinationType,
    constitutionalSafe,
    escalationRequired: input.governance.escalationRequired,
    containmentRequired: input.governance.containmentRequired,
  });

  const approvedActions = constitutionalSafe && validation.valid ? ["supervised_advisory_coordination"] : [];
  const coordinationRisk = clampMetric(
    (1 - input.strategicContinuity.survivabilityScore) * 0.45
      + (input.governance.escalationRequired ? 0.15 : 0.05)
      + (input.governance.containmentRequired ? 0.2 : 0.05)
      + (validation.valid ? 0.05 : 0.2),
    0.05,
  );

  return {
    coordinationId: `coordination:${input.timestamp}`,
    coordinationState: policies.coordinationType,
    approvedActions,
    deniedActions: Array.from(new Set([...policies.deniedActions, ...validation.blockedReasons])),
    requiredOversight: policies.requiredOversight,
    coordinationRisk,
    constitutionalSafe,
    escalationRequired: input.governance.escalationRequired,
    route: route.route,
    telemetry: buildAutonomyTelemetry({
      coordinationHealth: 1 - coordinationRisk,
      governancePressure: 1 - (input.governance.allowed ? 0.9 : 0.3),
      escalationSaturation: input.governance.escalationRequired ? 0.75 : 0.2,
      coordinationConflicts: validation.valid ? 0 : 1,
      survivabilityDegradation: 1 - input.strategicContinuity.survivabilityScore,
      timestamp: input.timestamp,
    }),
  };
}
