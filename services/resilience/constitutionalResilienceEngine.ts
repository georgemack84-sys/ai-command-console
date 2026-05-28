import { assessConstitutionalResilience } from "./resilienceAssessment";
import { buildCollapsePreventionPlan } from "./collapsePrevention";
import { buildContinuityArchitecture } from "./continuityArchitecture";
import { buildSurvivabilityProtocols } from "./survivabilityProtocols";
import { buildEmergencyContinuityPlan } from "./emergencyContinuity";
import { buildProtectedOperationsView } from "./protectedOperations";
import { buildResilienceTelemetrySnapshot } from "./resilienceTelemetry";
import { buildConstitutionalResilienceAuditRecord } from "./resilienceAudit";

export enum ConstitutionalResilienceState {
  STABLE = "STABLE",
  DEGRADED = "DEGRADED",
  UNSTABLE = "UNSTABLE",
  CONTINUITY_ACTIVE = "CONTINUITY_ACTIVE",
  CONTAINMENT_ACTIVE = "CONTAINMENT_ACTIVE",
  GOVERNANCE_PROTECTED = "GOVERNANCE_PROTECTED",
  PARTITIONED = "PARTITIONED",
  RECOVERY_ACTIVE = "RECOVERY_ACTIVE",
  SURVIVABILITY_CRITICAL = "SURVIVABILITY_CRITICAL",
  CONSTITUTIONAL_EMERGENCY = "CONSTITUTIONAL_EMERGENCY",
  COLLAPSE_PREVENTION = "COLLAPSE_PREVENTION",
  READINESS_REVIEW = "READINESS_REVIEW",
  READINESS_BLOCKED = "READINESS_BLOCKED",
  FROZEN = "FROZEN",
}

export type ConstitutionalResilienceAssessment = {
  resilienceState: ConstitutionalResilienceState;
  constitutionalIntegrity: number;
  governanceContinuity: number;
  operationalViability: number;
  containmentEffectiveness: number;
  auditPreservationConfidence: number;
  escalationPressure: number;
  systemicInstability: number;
  recoverabilityConfidence: number;
  isolatedDomains: string[];
  failingDomains: string[];
  survivableDomains: string[];
  emergencyControlsRequired: boolean;
  operatorInterventionRequired: boolean;
  constitutionalRiskDetected: boolean;
  createdAt: number;
  readinessCompatible: boolean;
};

function mapResilienceState(input: {
  governanceSafe: boolean;
  executiveBlockedReasons: string[];
  legacyState: string;
  survivabilityState: string;
  containmentRequired: boolean;
  emergencyControlsRequired: boolean;
  systemicInstability: number;
}) : ConstitutionalResilienceState {
  if (!input.governanceSafe || input.executiveBlockedReasons.length > 0 || input.legacyState === "CONSTITUTIONALLY_FROZEN") {
    return ConstitutionalResilienceState.FROZEN;
  }
  if (input.emergencyControlsRequired) {
    return ConstitutionalResilienceState.CONSTITUTIONAL_EMERGENCY;
  }
  if (["COLLAPSING", "CRITICAL"].includes(input.legacyState) || ["COLLAPSING", "CRITICAL"].includes(input.survivabilityState)) {
    return ConstitutionalResilienceState.SURVIVABILITY_CRITICAL;
  }
  if (input.containmentRequired) {
    return ConstitutionalResilienceState.CONTAINMENT_ACTIVE;
  }
  if (input.legacyState === "SURVIVABILITY_DISPUTED" || input.survivabilityState === "DISPUTED") {
    return ConstitutionalResilienceState.READINESS_BLOCKED;
  }
  if (input.systemicInstability >= 0.72) {
    return ConstitutionalResilienceState.COLLAPSE_PREVENTION;
  }
  if (input.systemicInstability >= 0.55 || ["UNSTABLE", "STRESSED"].includes(input.legacyState)) {
    return ConstitutionalResilienceState.UNSTABLE;
  }
  if (input.survivabilityState === "RECOVERING" || input.legacyState === "RECOVERING") {
    return ConstitutionalResilienceState.RECOVERY_ACTIVE;
  }
  if (input.survivabilityState === "CONTAINED") {
    return ConstitutionalResilienceState.CONTAINMENT_ACTIVE;
  }
  if (input.survivabilityState === "ISOLATED") {
    return ConstitutionalResilienceState.PARTITIONED;
  }
  if (input.survivabilityState === "DEGRADED" || input.legacyState === "DEGRADED") {
    return ConstitutionalResilienceState.DEGRADED;
  }
  return ConstitutionalResilienceState.STABLE;
}

export function buildConstitutionalResilienceEngine(input: {
  executiveModel: {
    governancePressure: {
      governanceIntegrity: number;
      escalationPressure: number;
      operationalRisk: number;
      constitutionalStability: number;
    };
    survivabilityCard: {
      survivabilityState: string;
      continuityConfidence: number;
      collapseProbability: number;
      stabilizationConfidence: number;
      degradationVelocity: number;
      strategicThreatLevel: number;
      emergencyControlsActive: boolean;
    };
    strategicForecast: {
      collapseRisk: number;
      uncertaintyLevel: number;
      survivabilityProjection: number;
      projectedContainmentLoad: number;
      governanceStressProjection: number;
    };
    constraints: {
      governanceSafe: boolean;
      blockedReasons: string[];
    };
    controlPlane: {
      governance: {
        constitutionalState: string;
        governanceConfidence: number;
        violations?: string[];
      };
      dashboard: unknown;
      continuity: {
        survivabilityScore: number;
      };
      sovereignty: {
        governanceIntegrity: number;
        survivabilityConfidence?: number;
      };
      survivability: {
        assessment: {
          survivabilityState: string;
          constitutionalIntegrity: number;
          governanceContinuity: number;
          operationalViability: number;
          containmentEffectiveness: number;
          auditPreservationConfidence: number;
          escalationPressure: number;
          systemicInstability: number;
          recoverabilityConfidence: number;
          isolatedDomains: string[];
          failingDomains: string[];
          survivableDomains: string[];
          emergencyControlsRequired: boolean;
          operatorInterventionRequired: boolean;
          constitutionalRiskDetected: boolean;
          createdAt: number;
        };
        containment: {
          containmentState: string;
          recommendedAction: string;
          containmentEffectiveness: number;
          containmentRequired: boolean;
          isolatedDomains: string[];
          quarantinedDomains: string[];
          degradedDomains: string[];
          operatorInterventionRequired?: boolean;
          emergencyStabilizationRequired?: boolean;
        };
        blockedReasons: string[];
        protocols?: {
          protocols?: string[];
        };
        emergencyStabilization: {
          required: boolean;
        };
      };
      supervision: {
        supervisionState?: string;
      };
      enforcement: {
        emergencyLockActive?: boolean;
      };
      replayReview?: {
        blockedReasons?: string[];
      };
      disputeReview?: {
        unresolvedDisputes?: string[];
      };
      reviewEscalation?: {
        escalationRequired?: boolean;
      };
    };
    audit?: {
      auditId?: string;
    };
  };
  nowMs: number;
}) {
  const legacy = assessConstitutionalResilience(input.executiveModel.controlPlane.dashboard as never);
  const survivability = input.executiveModel.controlPlane.survivability;
  const inheritedBlockedReasons = Array.from(
    new Set([
      ...input.executiveModel.constraints.blockedReasons,
      ...survivability.blockedReasons,
      ...((input.executiveModel.controlPlane.replayReview?.blockedReasons) || []),
      ...((input.executiveModel.controlPlane.disputeReview?.unresolvedDisputes) || []),
    ]),
  ).sort();

  const resilienceState = mapResilienceState({
    governanceSafe: input.executiveModel.constraints.governanceSafe,
    executiveBlockedReasons: inheritedBlockedReasons,
    legacyState: legacy.assessment.resilienceState,
    survivabilityState: survivability.assessment.survivabilityState,
    containmentRequired: survivability.containment.containmentRequired,
    emergencyControlsRequired: survivability.assessment.emergencyControlsRequired,
    systemicInstability: survivability.assessment.systemicInstability,
  });

  const assessment: ConstitutionalResilienceAssessment = {
    resilienceState,
    constitutionalIntegrity: survivability.assessment.constitutionalIntegrity,
    governanceContinuity: survivability.assessment.governanceContinuity,
    operationalViability: survivability.assessment.operationalViability,
    containmentEffectiveness: survivability.assessment.containmentEffectiveness,
    auditPreservationConfidence: survivability.assessment.auditPreservationConfidence,
    escalationPressure: survivability.assessment.escalationPressure,
    systemicInstability: survivability.assessment.systemicInstability,
    recoverabilityConfidence: survivability.assessment.recoverabilityConfidence,
    isolatedDomains: survivability.containment.isolatedDomains,
    failingDomains: survivability.assessment.failingDomains,
    survivableDomains: survivability.assessment.survivableDomains,
    emergencyControlsRequired: survivability.assessment.emergencyControlsRequired,
    operatorInterventionRequired: survivability.assessment.operatorInterventionRequired,
    constitutionalRiskDetected: survivability.assessment.constitutionalRiskDetected,
    createdAt: input.nowMs,
    readinessCompatible: input.executiveModel.constraints.governanceSafe && resilienceState !== ConstitutionalResilienceState.FROZEN,
  };

  const continuity = buildContinuityArchitecture({
    assessment,
    survivabilityCard: input.executiveModel.survivabilityCard,
    strategicForecast: input.executiveModel.strategicForecast,
    blockedReasons: inheritedBlockedReasons,
  });
  const collapsePrevention = buildCollapsePreventionPlan({
    survivabilityState: assessment.resilienceState,
    collapseRisk: Math.max(input.executiveModel.survivabilityCard.collapseProbability, input.executiveModel.strategicForecast.collapseRisk),
    governanceSafe: input.executiveModel.constraints.governanceSafe,
    isolatedDomains: assessment.isolatedDomains,
    escalationPressure: assessment.escalationPressure,
    containmentRequired: survivability.containment.containmentRequired,
    createdAt: input.nowMs,
  });
  const protocols = buildSurvivabilityProtocols({
    resilienceState: assessment.resilienceState,
    blockedReasons: survivability.blockedReasons,
    emergencyControlsRequired: assessment.emergencyControlsRequired,
    containmentRequired: survivability.containment.containmentRequired,
  });
  const emergencyContinuity = buildEmergencyContinuityPlan({
    resilienceState: assessment.resilienceState,
    containmentState: survivability.containment.containmentState,
    blockedReasons: survivability.blockedReasons,
    isolatedDomains: survivability.containment.isolatedDomains,
    operatorInterventionRequired: assessment.operatorInterventionRequired,
    createdAt: input.nowMs,
  });
  const protectedOperations = buildProtectedOperationsView({
    continuity,
    protocols,
    degradedDomains: survivability.containment.degradedDomains,
    quarantinedDomains: survivability.containment.quarantinedDomains,
  });
  const telemetry = buildResilienceTelemetrySnapshot({
    assessment,
    continuity,
    collapsePrevention,
    createdAt: input.nowMs,
  });
  const audit = buildConstitutionalResilienceAuditRecord({
    assessment,
    continuity,
    collapsePrevention,
    sourceAuditId: input.executiveModel.audit?.auditId ?? `executive:${input.nowMs}`,
    createdAt: input.nowMs,
  });

  return {
    assessment,
    continuity,
    collapsePrevention,
    emergencyContinuity,
    protectedOperations,
    protocols,
    telemetry,
    audit,
    blockedReasons: inheritedBlockedReasons,
  };
}
