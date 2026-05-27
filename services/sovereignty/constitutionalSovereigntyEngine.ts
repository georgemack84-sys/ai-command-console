import { adaptReadinessToSovereignty } from "./readinessSovereigntyAdapter";
import { adaptResilienceToSovereignty } from "./resilienceSovereigntyAdapter";
import { inheritContinuitySignals } from "./continuityInheritance";
import { inheritContainmentSignals } from "./containmentInheritance";
import { inheritGovernanceSignals } from "./governanceInheritance";
import { assessConstitutionalSovereignty } from "./sovereigntyAssessment";
import { buildSovereigntyPolicies } from "./sovereigntyPolicies";
import { enforceSovereigntyBoundaries } from "./sovereigntyEnforcement";
import { buildSovereigntyLineage } from "./sovereigntyLineage";
import { buildSovereigntyAudit } from "./sovereigntyAudit";

export function buildConstitutionalSovereigntyEngine(input: {
  executive: {
    governancePressure: {
      governanceIntegrity: number;
      escalationPressure: number;
      containmentPressure: number;
      operationalRisk: number;
      autonomyPressure: number;
      constitutionalStability: number;
      approvalBacklog: number;
      survivabilityPressure: number;
    };
    constraints: {
      governanceSafe: boolean;
      blockedReasons: string[];
    };
    controlPlane: {
      sovereignty: {
        governanceIntegrity: number;
        survivabilityConfidence: number;
        systemicRisk: number;
        containmentEffectiveness: number;
        escalationPressure: number;
        emergencyControlsRequired: boolean;
        unstableDomains: string[];
      };
      coordination: {
        deniedActions: string[];
        requiredOversight: string[];
        coordinationRisk?: number;
      };
      governance: {
        constitutionalState: string;
      };
    };
  };
  resilience: {
    assessment: {
      constitutionalIntegrity: number;
      recoverabilityConfidence: number;
      operationalViability: number;
      systemicInstability?: number;
      emergencyControlsRequired: boolean;
      operatorInterventionRequired: boolean;
    };
    blockedReasons: string[];
  };
  readiness: {
    assessment: {
      readinessState?: string;
      governanceReliability: number;
      readinessConfidence: number;
      blockingRisks: string[];
      advisoryOnly: boolean;
      constitutionalSafe: boolean;
      autonomyPromotionAllowed: false;
    };
  };
  nowMs: number;
}) {
  const readiness = adaptReadinessToSovereignty({
    readinessState: input.readiness.assessment.readinessState ?? "ADVISORY_ONLY",
    readinessConfidence: input.readiness.assessment.readinessConfidence,
    blockingRisks: input.readiness.assessment.blockingRisks,
    advisoryOnly: input.readiness.assessment.advisoryOnly,
    autonomyPromotionAllowed: input.readiness.assessment.autonomyPromotionAllowed,
  });
  const resilience = adaptResilienceToSovereignty({
    resilienceState: input.executive.controlPlane.governance.constitutionalState,
    constitutionalIntegrity: input.resilience.assessment.constitutionalIntegrity,
    recoverabilityConfidence: input.resilience.assessment.recoverabilityConfidence,
    operationalViability: input.resilience.assessment.operationalViability,
    emergencyControlsRequired: input.resilience.assessment.emergencyControlsRequired,
    blockedReasons: input.resilience.blockedReasons,
  });
  const continuity = inheritContinuitySignals({
    survivabilityProjection: 1 - input.executive.governancePressure.survivabilityPressure,
    continuityConfidence: input.executive.controlPlane.sovereignty.survivabilityConfidence,
    uncertaintyLevel: 1 - input.executive.governancePressure.constitutionalStability,
    collapseRisk: input.executive.governancePressure.operationalRisk,
  });
  const containment = inheritContainmentSignals({
    containmentState: input.executive.controlPlane.governance.constitutionalState,
    containmentEffectiveness: input.executive.controlPlane.sovereignty.containmentEffectiveness,
    containmentRequired: input.executive.governancePressure.containmentPressure >= 0.6,
    isolatedDomains: input.executive.controlPlane.sovereignty.unstableDomains,
    frozenSystems: input.executive.constraints.blockedReasons,
  });
  const governance = inheritGovernanceSignals({
    governanceIntegrity: input.executive.controlPlane.sovereignty.governanceIntegrity,
    governanceReliability: input.readiness.assessment.governanceReliability,
    governanceSafe: input.executive.constraints.governanceSafe && input.readiness.assessment.constitutionalSafe,
    blockedReasons: [...input.executive.constraints.blockedReasons, ...input.readiness.assessment.blockingRisks],
    escalationPressure: input.executive.controlPlane.sovereignty.escalationPressure,
  });

  const assessment = assessConstitutionalSovereignty({
    constitutionalIntegrity: Math.min(resilience.survivabilityConfidence, input.resilience.assessment.constitutionalIntegrity),
    survivabilityConfidence: Math.min(resilience.survivabilityConfidence, continuity.continuityConfidence),
    operationalStability: resilience.operationalStability,
    governanceReliability: governance.governanceReliability,
    escalationPressure: governance.escalationPressure,
    containmentPressure: containment.containmentPressure,
    systemicRisk: Math.max(input.executive.controlPlane.sovereignty.systemicRisk, continuity.continuityRisk),
    autonomyRisk: Math.max(input.executive.governancePressure.autonomyPressure, input.executive.controlPlane.coordination.coordinationRisk ?? 0),
    civilizationScaleRisk: Math.max(input.executive.governancePressure.operationalRisk, continuity.continuityRisk, containment.containmentPressure),
    emergencyControlsRequired: input.resilience.assessment.emergencyControlsRequired || input.executive.controlPlane.sovereignty.emergencyControlsRequired,
    operatorInterventionRequired: input.resilience.assessment.operatorInterventionRequired || input.executive.controlPlane.coordination.requiredOversight.length > 0,
    unstableSystems: containment.unstableSystems,
    frozenSystems: containment.frozenSystems,
    constitutionalSafe: governance.constitutionalSafe && readiness.constitutionalSafe && resilience.constitutionalSafe,
    immutableAuditHealthy: true,
  });

  const policies = buildSovereigntyPolicies({
    sovereigntyState: assessment.sovereigntyState,
    constitutionalSafe: assessment.constitutionalSafe,
    immutableAuditHealthy: assessment.immutableAuditHealthy,
  });
  const enforcement = enforceSovereigntyBoundaries({
    sovereigntyState: assessment.sovereigntyState,
    constitutionalSafe: assessment.constitutionalSafe,
    immutableAuditHealthy: assessment.immutableAuditHealthy,
    blockedReasons: [...governance.inheritedConstraints, ...readiness.inheritedConstraints],
  });
  const lineage = buildSovereigntyLineage({
    derivedFrom: ["executive", "resilience", "readiness", "containment", "continuity"],
    inheritedConstraints: [...policies.inheritedRestrictions, ...enforcement.requiredActions],
    createdAt: input.nowMs,
  });
  const audit = buildSovereigntyAudit({
    assessment,
    lineageId: lineage.lineageId,
    createdAt: input.nowMs,
  });

  return {
    assessment,
    policies,
    enforcement,
    lineage,
    audit,
  };
}
