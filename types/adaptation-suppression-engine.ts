import type { AdaptationPrioritizationResult, PrioritizedAdaptationProposal } from "@/types/adaptation-prioritization-engine";

export type AdaptationSuppressionOutcome = "SUPPRESSED" | "REQUIRES_REWORK" | "RETURN_FOR_ANALYSIS" | "CONTINUE";

export type AdaptationSuppressionRule =
  | "WEAK_EVIDENCE"
  | "UNCLEAR_BENEFIT"
  | "EXCESSIVE_RISK"
  | "INCOMPLETE_REPLAY"
  | "UNRESOLVED_GOVERNANCE"
  | "UNRESOLVED_AUTHORITY"
  | "DUPLICATE_PROPOSAL"
  | "CERTIFICATION_CONFLICT"
  | "RESTRICTED_LEARNING_DOMAIN"
  | "REDUCED_EXPLAINABILITY"
  | "INCREASED_OPERATOR_CONFUSION"
  | "ROLLBACK_UNAVAILABLE";

export type AdaptationSuppressionState = "EVALUATED" | "FAIL_CLOSED";

export type AdaptationSuppressionFailure =
  | "PROPOSAL_VALIDATION_FAILED"
  | "EVIDENCE_CANNOT_BE_EVALUATED"
  | "GOVERNANCE_ANALYSIS_UNAVAILABLE"
  | "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE"
  | "REPLAY_VALIDATION_UNAVAILABLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DETERMINISTIC_EVALUATION_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "DEFICIENCY_FABRICATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "CONSTITUTIONAL_BYPASS_ATTEMPT"
  | "UNSUPPORTED_SUPPRESSION_WITHOUT_EVIDENCE"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "PROPOSAL_PRIORITIZATION_ATTEMPT"
  | "PROPOSAL_IMPLEMENTATION_ATTEMPT";

export type AdaptationSuppressionScenario =
  | "BASELINE"
  | "WEAK_EVIDENCE"
  | "UNCLEAR_BENEFIT"
  | "EXCESSIVE_RISK"
  | "INCOMPLETE_REPLAY"
  | "UNRESOLVED_GOVERNANCE"
  | "UNRESOLVED_AUTHORITY"
  | "DUPLICATE_PROPOSAL"
  | "CERTIFICATION_CONFLICT"
  | "RESTRICTED_LEARNING_DOMAIN"
  | "REDUCED_EXPLAINABILITY"
  | "INCREASED_OPERATOR_CONFUSION"
  | "ROLLBACK_UNAVAILABLE"
  | "INVALID_PROPOSAL"
  | "EVIDENCE_UNAVAILABLE"
  | "GOVERNANCE_UNAVAILABLE"
  | "CONSTITUTIONAL_UNAVAILABLE"
  | "REPLAY_UNAVAILABLE"
  | "INTEGRITY_FAILURE"
  | "NONDETERMINISTIC_EVALUATION"
  | "TENANT_VIOLATION"
  | "MUTATION_ATTEMPT"
  | "FABRICATED_DEFICIENCY"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "UNSUPPORTED_SUPPRESSION"
  | "APPROVAL_ATTEMPT"
  | "PRIORITIZATION_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT";

export type SuppressionExplanation = Readonly<{
  explanation_id: string;
  proposal_id: string;
  suppression_outcome: AdaptationSuppressionOutcome;
  triggering_conditions: readonly string[];
  violated_rules: readonly AdaptationSuppressionRule[];
  evidence_references: readonly string[];
  governance_considerations: readonly string[];
  constitutional_considerations: readonly string[];
  operator_impact: string;
  replay_references: readonly string[];
  remediation_guidance: readonly string[];
  decision_timestamp: string;
  decision_version: "adaptation-suppression-rules/v1";
  integrity_hash: string;
}>;

export type SuppressionDecision = Readonly<{
  suppression_decision_id: string;
  proposal_id: string;
  generated_proposal_id: string;
  priority_id: string;
  outcome: AdaptationSuppressionOutcome;
  triggered_rules: readonly AdaptationSuppressionRule[];
  rationale: string;
  explanation: SuppressionExplanation;
  duplicate_of: string;
  can_continue_downstream: boolean;
  routed_to_consolidation: boolean;
  fail_closed: boolean;
  advisory_only: true;
  modifies_proposal: false;
  deletes_proposal: false;
  approves_proposal: false;
  rejects_proposal: false;
  implements_proposal: false;
  prioritizes_proposal: false;
  integrity_hash: string;
}>;

export type AdaptationSuppressionMetrics = Readonly<{
  proposals_evaluated: number;
  proposals_suppressed: number;
  suppression_rate: number;
  suppression_reasons: Readonly<Record<AdaptationSuppressionRule, number>>;
  duplicate_detections: number;
  governance_related_suppressions: number;
  constitutional_suppressions: number;
  replay_failures: number;
  rollback_deficiencies: number;
  operator_safety_suppressions: number;
  explainability_suppressions: number;
  evaluation_latency_ms: number;
  deterministic_replay_success: boolean;
  validation_failures: readonly AdaptationSuppressionFailure[];
  integrity_hash: string;
}>;

export type AdaptationSuppressionApiSurface = Readonly<{
  api_id: string;
  evaluate_suppression: "POST /adaptation-suppression-engine/evaluate";
  retrieve_decisions: "POST /adaptation-suppression-engine/decisions";
  retrieve_explanations: "POST /adaptation-suppression-engine/explanations";
  retrieve_metrics: "POST /adaptation-suppression-engine/metrics";
  replay_suppression: "POST /adaptation-suppression-engine/replay";
  inspect_suppression: "POST /adaptation-suppression-engine/inspect";
  retrieve_contract: "GET /adaptation-suppression-engine/contract";
  proposal_content_mutation_supported: false;
  deficiency_fabrication_supported: false;
  approval_supported: false;
  rejection_supported: false;
  implementation_supported: false;
  prioritization_supported: false;
  production_mutation_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationSuppressionInput = Readonly<{
  scenario?: AdaptationSuppressionScenario;
  prioritization_result?: AdaptationPrioritizationResult;
}>;

export type AdaptationSuppressionResult = Readonly<{
  adaptation_suppression_engine_version: "adaptation-suppression-engine/v1";
  decision_version: "adaptation-suppression-rules/v1";
  api_surface: AdaptationSuppressionApiSurface;
  prioritization_result: AdaptationPrioritizationResult;
  suppression_decisions: readonly SuppressionDecision[];
  metrics: AdaptationSuppressionMetrics;
  suppression_state: AdaptationSuppressionState;
  failures: readonly AdaptationSuppressionFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  evidence_evaluated: boolean;
  governance_enforced: boolean;
  constitutional_enforced: boolean;
  advisory_only: true;
  modifies_proposals: false;
  deletes_proposals: false;
  approves_proposals: false;
  rejects_proposals: false;
  implements_proposals: false;
  prioritizes_proposals: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationSuppressionFoundation = Readonly<{
  adaptation_suppression_engine_version: "adaptation-suppression-engine/v1";
  supported_rules: readonly AdaptationSuppressionRule[];
  supported_outcomes: readonly AdaptationSuppressionOutcome[];
  api_surface: AdaptationSuppressionApiSurface;
  result: AdaptationSuppressionResult;
}>;

export type SuppressionCandidate = PrioritizedAdaptationProposal;
