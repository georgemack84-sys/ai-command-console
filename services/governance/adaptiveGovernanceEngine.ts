import type { GovernanceConfidenceResult } from "./governanceConfidence";
import { evaluateGovernanceConfidence } from "./governanceConfidence";
import {
  buildGovernanceRecommendations,
  type GovernanceRecommendation,
} from "./governanceRecommendations";
import { validateGovernanceConstraints } from "./governanceConstraints";
import { buildGovernanceAdvisoryAuditRecord } from "./governanceAdvisoryAudit";
import type { OperationalSovereigntyAssessment } from "../sovereignty/operationalSovereigntyEngine";

export type AdaptiveGovernanceInput = {
  source: "operator" | "system" | "audit" | "simulation" | "coordination" | "sovereignty";
  observedIssue: string;
  evidence: string[];
  affectedSystems: string[];
  currentRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sovereigntyAssessment?: OperationalSovereigntyAssessment;
  constitutionalContext: {
    immutableTruthAffected: boolean;
    approvalRequired: boolean;
    escalationRequired: boolean;
    disputedStatePresent: boolean;
  };
};

export type AdaptiveGovernanceResult = {
  recommendationId: string;
  acceptedForReview: boolean;
  recommendations: GovernanceRecommendation[];
  blockedRecommendations: string[];
  confidence: number;
  requiresApproval: boolean;
  advisoryOnly: true;
  auditRef: string;
};

function selectAuditEvent(input: {
  recommendations: GovernanceRecommendation[];
  blockedRecommendations: string[];
  confidence: GovernanceConfidenceResult;
  sovereigntyAssessment?: OperationalSovereigntyAssessment;
}) {
  if (input.sovereigntyAssessment?.sovereigntyState === "EMERGENCY_CONTAINMENT") {
    return "governance.emergency_containment.recommended" as const;
  }
  if (input.blockedRecommendations.length > 0) {
    return "governance.recommendation.constraint_violation" as const;
  }
  if (input.confidence.confidenceBand === "LOW") {
    return "governance.recommendation.low_confidence" as const;
  }
  if (input.recommendations.some((recommendation) => recommendation.requiresApproval)) {
    return "governance.recommendation.requires_approval" as const;
  }
  if (input.sovereigntyAssessment && input.sovereigntyAssessment.sovereigntyState !== "STABLE") {
    return "governance.sovereignty_risk.detected" as const;
  }
  return "governance.recommendation.created" as const;
}

export function evaluateAdaptiveGovernance(input: AdaptiveGovernanceInput & { timestamp: string }): AdaptiveGovernanceResult {
  const recommendations = buildGovernanceRecommendations({
    source: input.source,
    observedIssue: input.observedIssue,
    currentRiskLevel: input.currentRiskLevel,
    sovereigntyAssessment: input.sovereigntyAssessment,
    constitutionalContext: input.constitutionalContext,
  });
  const constrained = validateGovernanceConstraints({
    recommendations,
    sovereigntyAssessment: input.sovereigntyAssessment,
    constitutionalContext: input.constitutionalContext,
  });
  const confidence = evaluateGovernanceConfidence({
    evidenceCount: input.evidence.length,
    expectedEvidenceCount: 3,
    disputedTruthPresent: input.constitutionalContext.disputedStatePresent,
    sovereigntyAssessment: input.sovereigntyAssessment,
  });
  const acceptedForReview =
    constrained.allowedRecommendations.length > 0
    && input.constitutionalContext.immutableTruthAffected === false;
  const audit = buildGovernanceAdvisoryAuditRecord({
    eventType: selectAuditEvent({
      recommendations: constrained.allowedRecommendations,
      blockedRecommendations: constrained.blockedRecommendations,
      confidence,
      sovereigntyAssessment: input.sovereigntyAssessment,
    }),
    recommendationIds: constrained.allowedRecommendations.map((recommendation) => recommendation.recommendationId),
    blockedRecommendations: constrained.blockedRecommendations,
    evidenceRefs: input.evidence,
    timestamp: input.timestamp,
  });

  return {
    recommendationId: constrained.allowedRecommendations[0]?.recommendationId ?? `govrec:none:${input.timestamp}`,
    acceptedForReview,
    recommendations: constrained.allowedRecommendations.map((recommendation) => ({
      ...recommendation,
      confidence: Math.min(recommendation.confidence, confidence.confidence),
    })),
    blockedRecommendations: constrained.blockedRecommendations,
    confidence: confidence.confidence,
    requiresApproval: true,
    advisoryOnly: true,
    auditRef: audit.auditRef,
  };
}
