import { clampMetric } from "../stability/stabilityMetrics";
import type { AutonomousSupervisionResult } from "../autonomy/autonomousSupervision";
import type { OperationalSovereigntyAssessment } from "../sovereignty/operationalSovereigntyEngine";
import { buildEnforcementAuditRecord } from "./enforcementAudit";
import { evaluateEmergencyContainment } from "./emergencyContainment";
import { suppressExecution, type EnforcementState } from "./executionSuppression";
import { evaluateRuntimeEnforcementPolicies } from "./runtimeEnforcementPolicies";

export type ConstitutionalEnforcementResult = {
  executable: boolean;
  enforcementState: string;
  blockedReasons: string[];
  containmentApplied: boolean;
  escalationTriggered: boolean;
  emergencyLockActive: boolean;
  enforcementConfidence: number;
  auditRecord: ReturnType<typeof buildEnforcementAuditRecord>;
};

export function runConstitutionalEnforcementRuntime(input: {
  governance: {
    allowed: boolean;
    constitutionalState: string;
    governanceConfidence: number;
    violations: string[];
    escalationRequired: boolean;
    containmentRequired: boolean;
    requiredApprovals?: string[];
  };
  sovereignty: OperationalSovereigntyAssessment;
  continuity: {
    survivable: boolean;
    collapseRisk: number;
    containmentConfidence: number;
  };
  coordination: {
    constitutionalSafe: boolean;
    coordinationState: string;
    escalationRequired: boolean;
    route: string[];
  };
  supervision?: AutonomousSupervisionResult;
  validation: {
    valid: boolean;
    freezeActivated: boolean;
    blockedReasons: string[];
  };
  escalationLineagePresent: boolean;
  immutableAuditAvailable: boolean;
  timestamp: string;
}) : ConstitutionalEnforcementResult {
  const disputedTruthPresent =
    input.governance.violations.includes("disputed_truth_detected")
    || input.governance.violations.includes("disputed_truth_blocks_recovery")
    || input.validation.freezeActivated;

  const emergency = evaluateEmergencyContainment({
    sovereigntyState: input.sovereignty.sovereigntyState,
    constitutionalState: input.governance.constitutionalState,
    disputedTruthPresent,
    containmentRequired: input.governance.containmentRequired || input.sovereignty.containmentEffectiveness < 0.55,
    freezeActive: input.validation.freezeActivated,
  });

  const policies = evaluateRuntimeEnforcementPolicies({
    governanceAllowed: input.governance.allowed && input.validation.valid && input.coordination.constitutionalSafe,
    governanceConfidence: input.governance.governanceConfidence,
    constitutionalState: input.governance.constitutionalState,
    disputedTruthPresent,
    containmentRequired: emergency.containmentApplied,
    escalationRequired: input.governance.escalationRequired || input.coordination.escalationRequired,
    escalationLineagePresent: input.escalationLineagePresent,
    emergencyLockActive: emergency.emergencyLockActive,
    sovereigntyState: input.sovereignty.sovereigntyState,
    immutableAuditAvailable: input.immutableAuditAvailable,
    supervisionState: input.supervision?.supervisionState,
  });

  const enforcementConfidence = clampMetric(
    input.governance.governanceConfidence * 0.35
      + input.sovereignty.governanceIntegrity * 0.2
      + input.sovereignty.survivabilityConfidence * 0.15
      + (input.immutableAuditAvailable ? 0.15 : 0)
      + (input.validation.valid ? 0.15 : 0)
      - (emergency.emergencyLockActive ? 0.25 : 0)
      - (disputedTruthPresent ? 0.2 : 0),
    0.05,
  );

  const suppression = suppressExecution({
    blockedReasons: [
      ...policies.blockedReasons,
      ...(enforcementConfidence < policies.minimumEnforcementConfidence ? ["enforcement_confidence_below_threshold"] : []),
    ],
    containmentApplied: emergency.containmentApplied,
    escalationTriggered: emergency.escalationTriggered,
    emergencyLockActive: emergency.emergencyLockActive,
    executableCandidate:
      input.governance.allowed
      && input.validation.valid
      && input.coordination.constitutionalSafe
      && input.supervision?.supervisedExecutionAllowed !== false,
  });

  let enforcementState: EnforcementState = suppression.enforcementState as EnforcementState;
  if (input.sovereignty.sovereigntyState === "CRITICAL" && suppression.executable === false) {
    enforcementState = "EXECUTION_SUPPRESSED";
  }
  if (input.sovereignty.sovereigntyState === "COLLAPSING") {
    enforcementState = "CONTAINMENT_ACTIVE";
  }
  if (input.sovereignty.sovereigntyState === "EMERGENCY_CONTAINMENT") {
    enforcementState = "EMERGENCY_LOCK_ACTIVE";
  }

  const auditRecord = buildEnforcementAuditRecord({
    enforcementState,
    blockedReasons: suppression.blockedReasons,
    containmentApplied: emergency.containmentApplied,
    escalationTriggered: emergency.escalationTriggered,
    emergencyLockActive: emergency.emergencyLockActive,
    enforcementConfidence,
    sourceLineage: [
      `governance:${input.governance.constitutionalState}`,
      `sovereignty:${input.sovereignty.sovereigntyState}`,
      `coordination:${input.coordination.coordinationState}`,
      ...(input.supervision ? [`supervision:${input.supervision.supervisionState}`] : []),
    ],
    timestamp: input.timestamp,
  });

  return {
    executable: suppression.executable && enforcementConfidence >= policies.minimumEnforcementConfidence,
    enforcementState,
    blockedReasons: suppression.blockedReasons,
    containmentApplied: emergency.containmentApplied,
    escalationTriggered: emergency.escalationTriggered,
    emergencyLockActive: emergency.emergencyLockActive,
    enforcementConfidence,
    auditRecord,
  };
}
