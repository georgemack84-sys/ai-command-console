import type { ReadinessValidationInput, ReadinessValidationResult } from "./readinessTypes";

export function validateAutonomousRecoveryReadiness(input: ReadinessValidationInput): ReadinessValidationResult {
  const blockedReasons: string[] = [];
  const evidenceRefs: string[] = [];

  const constitutional = (input.constitutionalEnforcement || {}) as Record<string, unknown>;
  const decision = (input.decisionIntelligence || {}) as Record<string, unknown>;
  const simulationForecast = (input.simulationForecast || {}) as Record<string, unknown>;
  const simulationLineage = Array.isArray(input.simulationLineage) ? input.simulationLineage.map((entry) => String(entry)) : [];
  const convergence = (input.convergence || {}) as Record<string, unknown>;
  const escalation = (input.escalation || {}) as Record<string, unknown>;
  const containment = (input.containment || {}) as Record<string, unknown>;
  const rollback = (input.rollback || {}) as Record<string, unknown>;
  const auditEvidence = Array.isArray(input.auditEvidence) ? input.auditEvidence as Array<Record<string, unknown>> : [];

  if (!input.constitutionalEnforcement) blockedReasons.push("missing_constitutional_enforcement");
  if (!input.decisionIntelligence) blockedReasons.push("missing_decision_intelligence");
  if (auditEvidence.length === 0) blockedReasons.push("missing_audit_evidence");
  if (simulationLineage.length === 0) blockedReasons.push("missing_simulation_lineage");
  if ((simulationForecast.evidenceSufficient ?? false) !== true) blockedReasons.push("READINESS_BLOCKED_BY_UNTRUSTED_SIMULATION");
  if ((rollback.guaranteed ?? false) !== true) blockedReasons.push("READINESS_BLOCKED_BY_MISSING_ROLLBACK");
  if (typeof containment.confidence !== "number") blockedReasons.push("missing_containment_confidence");
  if (typeof convergence.continuityConfidence !== "number") blockedReasons.push("missing_convergence_confidence");
  if (typeof escalation.confidence !== "number") blockedReasons.push("missing_escalation_reliability");

  const constitutionalAction = String(constitutional.constitutionalAction || "");
  const decisionAction = String(decision.constitutionalAction || "");
  const constitutionalViolations = Array.isArray(constitutional.constitutionalViolations) ? constitutional.constitutionalViolations.map(String) : [];
  const decisionBlockedReasons = Array.isArray(decision.blockedReasons) ? decision.blockedReasons.map(String) : [];

  const constitutionalBlocked = ["DENY", "FREEZE", "CONTAIN"].includes(constitutionalAction)
    || ["DENY", "FREEZE", "CONTAIN"].includes(decisionAction)
    || constitutionalViolations.includes("disputed_truth_blocks_recovery")
    || constitutionalViolations.includes("immutable_evidence_protected");
  if (constitutionalBlocked && (constitutionalAction === "FREEZE" || decisionAction === "FREEZE")) {
    blockedReasons.push("READINESS_BLOCKED_BY_FREEZE");
  }

  const disputed = constitutionalViolations.includes("disputed_truth_blocks_recovery")
    || decisionBlockedReasons.includes("disputed_truth_blocks_recovery")
    || Boolean((input.stability as Record<string, unknown> | undefined)?.disputed)
    || Boolean(escalation.blocked)
    || Boolean(escalation.frozen);
  if (disputed) blockedReasons.push("READINESS_BLOCKED_BY_DISPUTED_TRUTH");

  evidenceRefs.push(
    ...simulationLineage,
    ...auditEvidence.map((entry) => String(entry.id || "")).filter(Boolean).slice(0, 6),
  );

  return {
    valid: blockedReasons.length === 0,
    blockedReasons: Array.from(new Set(blockedReasons)),
    disputed,
    constitutionalBlocked,
    evidenceRefs: Array.from(new Set(evidenceRefs)),
  };
}

export function validateConstitutionalReadiness(input: {
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
  disputedSignals: string[];
  inheritedConstraints: string[];
}) {
  const blockingRisks = [
    ...(input.disputedSignals.length > 0 ? ["READINESS_BLOCKED_BY_DISPUTED_TRUTH"] : []),
    ...(input.auditIntegrity < 0.55 ? ["READINESS_BLOCKED_BY_AUDIT_INTEGRITY"] : []),
    ...(input.containmentSurvivability < 0.55 ? ["READINESS_BLOCKED_BY_CONTAINMENT_SURVIVABILITY"] : []),
    ...(input.enforcementConsistency < 0.55 ? ["READINESS_BLOCKED_BY_ENFORCEMENT_CONSISTENCY"] : []),
    ...input.inheritedConstraints,
  ];

  return {
    valid: blockingRisks.length === 0,
    blockingRisks: Array.from(new Set(blockingRisks)).sort(),
    warnings: Array.from(new Set([
      ...(input.governanceReliability < 0.7 ? ["governance_reliability_declining"] : []),
      ...(input.simulationTrustworthiness < 0.7 ? ["simulation_trustworthiness_limited"] : []),
      ...(input.continuityStability < 0.7 ? ["continuity_stability_limited"] : []),
      ...(input.operatorOverrideReliability < 0.7 ? ["operator_override_reliability_limited"] : []),
      ...(input.operationalExplainability < 0.7 ? ["operational_explainability_limited"] : []),
      ...(input.deterministicRecoveryConfidence < 0.7 ? ["deterministic_recovery_confidence_limited"] : []),
    ])).sort(),
  };
}
