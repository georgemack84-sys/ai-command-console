import type { OperationalSovereigntyAssessment } from "../sovereignty/operationalSovereigntyEngine";

export type GovernanceRecommendationCategory =
  | "POLICY_ADJUSTMENT"
  | "OPERATIONAL_SAFEGUARD"
  | "ESCALATION_TUNING"
  | "STABILIZATION_STRATEGY"
  | "CONTAINMENT_IMPROVEMENT"
  | "AUDIT_ENHANCEMENT"
  | "READINESS_IMPROVEMENT"
  | "RISK_REDUCTION"
  | "CONSTITUTIONAL_REVIEW_REQUIRED"
  | "EMERGENCY_CONTAINMENT_REVIEW";

export type GovernanceRecommendation = {
  recommendationId: string;
  category: string;
  recommendation: string;
  justification: string[];
  operationalImpact: string;
  constitutionalRisk: string;
  confidence: number;
  requiresApproval: boolean;
  advisoryOnly: true;
};

function stableToken(parts: string[]) {
  return parts
    .join(":")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildGovernanceRecommendation(input: {
  source: string;
  observedIssue: string;
  category: GovernanceRecommendationCategory;
  recommendation: string;
  justification: string[];
  operationalImpact: string;
  constitutionalRisk: string;
  confidence: number;
  requiresApproval: boolean;
}) : GovernanceRecommendation {
  if (!input.observedIssue || !input.recommendation || input.justification.length === 0) {
    throw new Error("malformed_governance_recommendation");
  }

  return {
    recommendationId: `govrec:${stableToken([input.source, input.category, input.observedIssue])}`,
    category: input.category,
    recommendation: input.recommendation,
    justification: Array.from(new Set(input.justification)),
    operationalImpact: input.operationalImpact,
    constitutionalRisk: input.constitutionalRisk,
    confidence: Math.max(0.05, Math.min(1, input.confidence)),
    requiresApproval: input.requiresApproval,
    advisoryOnly: true,
  };
}

export function buildGovernanceRecommendations(input: {
  source: string;
  observedIssue: string;
  currentRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sovereigntyAssessment?: OperationalSovereigntyAssessment;
  constitutionalContext: {
    immutableTruthAffected: boolean;
    approvalRequired: boolean;
    escalationRequired: boolean;
    disputedStatePresent: boolean;
  };
}) {
  const sovereigntyState = input.sovereigntyAssessment?.sovereigntyState;

  if (sovereigntyState === "EMERGENCY_CONTAINMENT") {
    return [
      buildGovernanceRecommendation({
        source: input.source,
        observedIssue: input.observedIssue,
        category: "EMERGENCY_CONTAINMENT_REVIEW",
        recommendation: "Conduct emergency containment review with operator approval.",
        justification: ["emergency_containment_state_detected", "normal_adaptation_frozen"],
        operationalImpact: "Preserves containment precedence during emergency instability.",
        constitutionalRisk: "High",
        confidence: 0.62,
        requiresApproval: true,
      }),
    ];
  }

  if (sovereigntyState === "COLLAPSING") {
    return [
      buildGovernanceRecommendation({
        source: input.source,
        observedIssue: input.observedIssue,
        category: "STABILIZATION_STRATEGY",
        recommendation: "Pause governance loosening and review stabilization strategy under human supervision.",
        justification: ["collapse_indicators_detected", "stabilization_review_required"],
        operationalImpact: "Prevents unsafe adaptation during collapse.",
        constitutionalRisk: "High",
        confidence: 0.58,
        requiresApproval: true,
      }),
      buildGovernanceRecommendation({
        source: input.source,
        observedIssue: input.observedIssue,
        category: "EMERGENCY_CONTAINMENT_REVIEW",
        recommendation: "Review emergency containment posture before any further adaptation.",
        justification: ["collapse_indicators_detected", "containment_precedence_required"],
        operationalImpact: "Strengthens containment-first posture.",
        constitutionalRisk: "High",
        confidence: 0.56,
        requiresApproval: true,
      }),
    ];
  }

  const recommendations: GovernanceRecommendation[] = [
    buildGovernanceRecommendation({
      source: input.source,
      observedIssue: input.observedIssue,
      category: input.constitutionalContext.escalationRequired ? "ESCALATION_TUNING" : "OPERATIONAL_SAFEGUARD",
      recommendation: input.constitutionalContext.escalationRequired
        ? "Review escalation tuning thresholds under operator supervision."
        : "Strengthen supervisory safeguards around the affected systems.",
      justification: [
        input.constitutionalContext.escalationRequired ? "escalation_pressure_observed" : "operational_safeguard_recommended",
        `risk_level_${input.currentRiskLevel.toLowerCase()}`,
      ],
      operationalImpact: "Improves supervisory control without changing live authority.",
      constitutionalRisk: input.currentRiskLevel === "CRITICAL" ? "High" : "Moderate",
      confidence: input.currentRiskLevel === "LOW" ? 0.74 : 0.68,
      requiresApproval: input.constitutionalContext.approvalRequired,
    }),
    buildGovernanceRecommendation({
      source: input.source,
      observedIssue: input.observedIssue,
      category: "RISK_REDUCTION",
      recommendation: "Review cross-domain safeguards to reduce systemic instability.",
      justification: ["risk_reduction_candidate_identified"],
      operationalImpact: "May reduce future instability and escalation saturation.",
      constitutionalRisk: "Low",
      confidence: 0.66,
      requiresApproval: false,
    }),
  ];

  if (input.constitutionalContext.disputedStatePresent || sovereigntyState === "GOVERNANCE_RISK") {
    recommendations.push(
      buildGovernanceRecommendation({
        source: input.source,
        observedIssue: input.observedIssue,
        category: "CONSTITUTIONAL_REVIEW_REQUIRED",
        recommendation: "Escalate to constitutional review before considering policy adjustments.",
        justification: ["disputed_or_governance_risk_detected"],
        operationalImpact: "Preserves governance supremacy during degraded confidence.",
        constitutionalRisk: "High",
        confidence: 0.61,
        requiresApproval: true,
      }),
    );
  }

  if (sovereigntyState === "CONTAINMENT_ACTIVE") {
    recommendations.push(
      buildGovernanceRecommendation({
        source: input.source,
        observedIssue: input.observedIssue,
        category: "CONTAINMENT_IMPROVEMENT",
        recommendation: "Review containment effectiveness and strengthen containment safeguards.",
        justification: ["containment_active_state_detected"],
        operationalImpact: "Improves containment resilience without weakening controls.",
        constitutionalRisk: "Moderate",
        confidence: 0.64,
        requiresApproval: true,
      }),
    );
  }

  return recommendations;
}
