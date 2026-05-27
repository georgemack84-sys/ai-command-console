import { validateConstitutionalReadiness } from "./readinessValidation";
import { scoreConstitutionalReadiness } from "./readinessScoring";
import { determineConstitutionalReadinessState } from "./readinessPolicies";
import { analyzeReadinessDrift, type ReadinessDrift } from "./readinessDriftAnalysis";
import { buildConfidenceLineage, type ConfidenceLineage } from "./confidenceLineage";
import { buildSurvivabilityDependencyGraph } from "./survivabilityDependencyGraph";
import { buildOperatorReadinessReview } from "./operatorReadinessReview";
import { buildConstitutionalReadinessAuditRecord } from "./readinessAudit";

export type ConstitutionalReadinessState =
  | "NOT_READY"
  | "LIMITED_READY"
  | "CONDITIONALLY_READY"
  | "OPERATOR_REVIEW_REQUIRED"
  | "GOVERNANCE_BLOCKED"
  | "READINESS_CONFIDENCE_LOW"
  | "ADVISORY_ONLY";

export type ConstitutionalReadinessAssessment = {
  readinessState: ConstitutionalReadinessState;
  governanceReliability: number;
  auditIntegrity: number;
  containmentSurvivability: number;
  escalationCoordinationReliability: number;
  simulationTrustworthiness: number;
  continuityStability: number;
  operatorOverrideReliability: number;
  enforcementConsistency: number;
  operationalExplainability: number;
  deterministicRecoveryConfidence: number;
  readinessConfidence: number;
  blockingRisks: string[];
  warnings: string[];
  requiredOperatorActions: string[];
  autonomyPromotionAllowed: false;
  advisoryOnly: true;
  constitutionalSafe: boolean;
  generatedAt: number;
};

function clamp(value: number) {
  return Number(Math.max(0.05, Math.min(1, value)).toFixed(4));
}

export function evaluateConstitutionalReadiness(input: {
  resilience: {
    assessment: {
      resilienceState: string;
      constitutionalIntegrity: number;
      governanceContinuity: number;
      containmentEffectiveness: number;
      auditPreservationConfidence: number;
      escalationPressure: number;
      recoverabilityConfidence: number;
      systemicInstability: number;
      emergencyControlsRequired: boolean;
      operatorInterventionRequired: boolean;
      readinessCompatible: boolean;
    };
    blockedReasons: string[];
  };
  executive: {
    constraints: {
      governanceSafe: boolean;
      blockedReasons: string[];
    };
    strategicForecast: {
      uncertaintyLevel: number;
    };
    controlPlane: {
      governance: {
        governanceConfidence: number;
        constitutionalState: string;
      };
      survivability: {
        containment: {
          containmentEffectiveness: number;
        };
        blockedReasons: string[];
      };
      supervision: {
        supervisionConfidence: number;
      };
      enforcement: {
        enforcementConfidence: number;
        emergencyLockActive: boolean;
      };
      simulation: {
        deterministic: boolean;
      };
      replayReview: {
        blockedReasons: string[];
      };
      disputeReview: {
        unresolvedDisputes: string[];
      };
      reviewEscalation: {
        escalationRequired: boolean;
      };
      continuity: {
        survivabilityScore: number;
      };
      dashboard: {
        pendingApprovals: unknown[];
      };
    };
  };
  nowMs: number;
}) {
  const governanceReliability = clamp((input.executive.controlPlane.governance.governanceConfidence * 0.6) + (input.resilience.assessment.governanceContinuity * 0.4));
  const auditIntegrity = clamp(input.resilience.assessment.auditPreservationConfidence);
  const containmentSurvivability = clamp(input.executive.controlPlane.survivability.containment.containmentEffectiveness);
  const escalationCoordinationReliability = clamp(
    (1 - input.resilience.assessment.escalationPressure) * 0.6
    + (input.executive.controlPlane.reviewEscalation.escalationRequired ? 0.3 : 0.7) * 0.4,
  );
  const simulationTrustworthiness = clamp(
    (input.executive.controlPlane.simulation.deterministic ? 0.82 : 0.25) - (input.executive.strategicForecast.uncertaintyLevel * 0.2),
  );
  const continuityStability = clamp(input.executive.controlPlane.continuity.survivabilityScore);
  const operatorOverrideReliability = clamp(
    input.executive.controlPlane.dashboard.pendingApprovals.length > 0 ? 0.84 : 0.74,
  );
  const enforcementConsistency = clamp(input.executive.controlPlane.enforcement.enforcementConfidence);
  const operationalExplainability = clamp(
    1 - ((input.executive.constraints.blockedReasons.length + input.resilience.blockedReasons.length) / 10),
  );
  const deterministicRecoveryConfidence = clamp(input.resilience.assessment.recoverabilityConfidence);

  const disputedSignals = Array.from(new Set([
    ...input.executive.controlPlane.replayReview.blockedReasons,
    ...input.executive.controlPlane.disputeReview.unresolvedDisputes,
  ]));
  const inheritedConstraints = Array.from(new Set([
    ...input.executive.constraints.blockedReasons,
    ...input.resilience.blockedReasons,
    ...(input.executive.controlPlane.enforcement.emergencyLockActive ? ["READINESS_BLOCKED_BY_EMERGENCY_LOCK"] : []),
  ]));

  const validation = validateConstitutionalReadiness({
    governanceReliability,
    auditIntegrity,
    containmentSurvivability,
    escalationCoordinationReliability,
    simulationTrustworthiness,
    continuityStability,
    operatorOverrideReliability,
    enforcementConsistency,
    operationalExplainability,
    deterministicRecoveryConfidence,
    disputedSignals,
    inheritedConstraints,
  });

  const readinessConfidence = scoreConstitutionalReadiness({
    governanceReliability,
    auditIntegrity,
    containmentSurvivability,
    escalationCoordinationReliability,
    simulationTrustworthiness,
    continuityStability,
    operatorOverrideReliability,
    enforcementConsistency,
    operationalExplainability,
    deterministicRecoveryConfidence,
  });

  const constitutionalSafe =
    input.executive.constraints.governanceSafe
    && input.resilience.assessment.readinessCompatible
    && validation.blockingRisks.length === 0;

  const readinessState = determineConstitutionalReadinessState({
    readinessConfidence,
    blockingRisks: validation.blockingRisks,
    warnings: validation.warnings,
    constitutionalSafe,
  });

  const requiredOperatorActions = Array.from(new Set([
    ...validation.blockingRisks.map((risk) => `resolve:${risk}`),
    ...validation.warnings.map((warning) => `review:${warning}`),
    ...(input.resilience.assessment.operatorInterventionRequired ? ["operator_review_required"] : []),
  ])).sort();

  const assessment: ConstitutionalReadinessAssessment = {
    readinessState,
    governanceReliability,
    auditIntegrity,
    containmentSurvivability,
    escalationCoordinationReliability,
    simulationTrustworthiness,
    continuityStability,
    operatorOverrideReliability,
    enforcementConsistency,
    operationalExplainability,
    deterministicRecoveryConfidence,
    readinessConfidence,
    blockingRisks: validation.blockingRisks,
    warnings: validation.warnings,
    requiredOperatorActions,
    autonomyPromotionAllowed: false,
    advisoryOnly: true,
    constitutionalSafe,
    generatedAt: input.nowMs,
  };

  const drifts: ReadinessDrift[] = analyzeReadinessDrift({
    previous: {
      governanceReliability: input.resilience.assessment.governanceContinuity,
      auditIntegrity: input.resilience.assessment.auditPreservationConfidence,
      containmentSurvivability: input.resilience.assessment.containmentEffectiveness,
      continuityStability: input.executive.controlPlane.continuity.survivabilityScore + (input.executive.strategicForecast.uncertaintyLevel * 0.05),
    },
    current: {
      governanceReliability,
      auditIntegrity,
      containmentSurvivability,
      continuityStability,
    },
  });

  const confidenceLineage: ConfidenceLineage[] = [
    buildConfidenceLineage({
      sourceSystem: "readiness",
      derivedFrom: ["governance", "containment", "continuity", "recovery"],
      inheritedConstraints,
      disputedSignals,
    }),
  ];
  const dependencyGraph = buildSurvivabilityDependencyGraph();
  const review = buildOperatorReadinessReview({
    readinessState,
    blockingRisks: validation.blockingRisks,
    warnings: validation.warnings,
  });
  const audit = buildConstitutionalReadinessAuditRecord({
    readinessState,
    readinessConfidence,
    blockingRisks: validation.blockingRisks,
    warnings: validation.warnings,
    requiredOperatorActions,
    sourceAuditId: `readiness-source:${input.nowMs}`,
    generatedAt: input.nowMs,
  });

  return {
    assessment,
    drifts,
    confidenceLineage,
    dependencyGraph,
    review,
    audit,
  };
}
