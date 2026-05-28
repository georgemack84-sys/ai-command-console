import { clampMetric } from "../stability/stabilityMetrics";
import { validateAutonomyConstraints } from "./autonomyConstraints";
import { buildAutonomyAuditRecord } from "./autonomyAudit";
import { buildSupervisionTelemetry } from "./autonomyTelemetry";
import { evaluateSupervisionPolicies } from "./supervisionPolicies";

export type SupervisionState =
  | "MONITORING"
  | "SUPERVISING"
  | "ASSISTING"
  | "STABILIZING"
  | "CONTAINING"
  | "ESCALATED"
  | "FROZEN"
  | "DISPUTED"
  | "VERIFIED"
  | "BLOCKED";

export type AutonomousSupervisionResult = {
  supervisionState: string;
  supervisedExecutionAllowed: boolean;
  stabilizationRecommended: boolean;
  escalationRequired: boolean;
  containmentRequired: boolean;
  operationalRisk: number;
  supervisionConfidence: number;
  blockedReasons: string[];
  auditRecord: ReturnType<typeof buildAutonomyAuditRecord>;
  telemetry: ReturnType<typeof buildSupervisionTelemetry>;
};

export function evaluateAutonomousSupervision(input: {
  governanceAllowed: boolean;
  approvalVerified: boolean;
  operatorOverrideAttempted: boolean;
  actionCategory: string;
  immutableEvidenceMutationAttempted: boolean;
  unboundedAutonomyRequested: boolean;
  emergencyContainmentActive: boolean;
  sovereigntyState?: string;
  coordinationRisk: number;
  escalationRequired: boolean;
  disputedTruthPresent: boolean;
  timestamp: string;
}) : AutonomousSupervisionResult {
  const constraints = validateAutonomyConstraints({
    actionCategory: input.actionCategory,
    operatorOverrideAttempted: input.operatorOverrideAttempted,
    approvalVerified: input.approvalVerified,
    governanceAllowed: input.governanceAllowed,
    immutableEvidenceMutationAttempted: input.immutableEvidenceMutationAttempted,
    unboundedAutonomyRequested: input.unboundedAutonomyRequested,
    emergencyContainmentActive: input.emergencyContainmentActive,
  });
  const policies = evaluateSupervisionPolicies({
    sovereigntyState: input.sovereigntyState,
    coordinationRisk: input.coordinationRisk,
    escalationRequired: input.escalationRequired,
    disputedTruthPresent: input.disputedTruthPresent,
    emergencyLockActive: input.emergencyContainmentActive,
  });

  let supervisionState: SupervisionState = policies.supervisionState as SupervisionState;
  if (!constraints.allowed) supervisionState = "BLOCKED";
  const containmentRequired =
    input.emergencyContainmentActive
    || input.sovereigntyState === "CONTAINMENT_ACTIVE"
    || input.sovereigntyState === "COLLAPSING"
    || input.sovereigntyState === "EMERGENCY_CONTAINMENT";
  const operationalRisk = clampMetric(
    input.coordinationRisk * 0.45
      + (input.escalationRequired ? 0.15 : 0.05)
      + (containmentRequired ? 0.2 : 0.05)
      + (input.disputedTruthPresent ? 0.15 : 0.05),
    0.05,
  );
  const supervisionConfidence = clampMetric(
    1
      - operationalRisk
      - (constraints.allowed ? 0 : 0.2),
    0.05,
  );
  const supervisedExecutionAllowed =
    constraints.allowed
    && !["BLOCKED", "FROZEN", "DISPUTED", "CONTAINING"].includes(supervisionState);

  const auditRecord = buildAutonomyAuditRecord({
    supervisionState,
    stabilizationRecommended: policies.stabilizationRecommended,
    escalationRequired: input.escalationRequired,
    containmentRequired,
    operationalRisk,
    supervisionConfidence,
    blockedReasons: constraints.blockedReasons,
    timestamp: input.timestamp,
  });

  return {
    supervisionState,
    supervisedExecutionAllowed,
    stabilizationRecommended: policies.stabilizationRecommended,
    escalationRequired: input.escalationRequired || input.sovereigntyState === "SURVIVABILITY_RISK",
    containmentRequired,
    operationalRisk,
    supervisionConfidence,
    blockedReasons: constraints.blockedReasons,
    auditRecord,
    telemetry: buildSupervisionTelemetry({
      runtimeHealth: 1 - operationalRisk,
      operationalRisk,
      escalationPressure: input.escalationRequired ? 0.75 : 0.2,
      stabilizationSignal: policies.stabilizationRecommended ? 1 : 0,
      timestamp: input.timestamp,
    }),
  };
}
