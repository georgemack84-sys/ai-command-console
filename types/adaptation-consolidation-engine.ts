import type { AdaptationSuppressionResult, SuppressionDecision } from "@/types/adaptation-suppression-engine";

export type AdaptationRelationshipType = "DUPLICATE" | "OVERLAPPING" | "COMPLEMENTARY" | "CONFLICTING" | "SEQUENTIAL" | "DEPENDENT" | "INDEPENDENT";

export type AdaptationConsolidationAction =
  | "MERGE_CANONICAL"
  | "MERGE_RELATED"
  | "COORDINATE_RECOMMENDATION"
  | "KEEP_SEPARATE_WITH_RELATIONSHIP"
  | "KEEP_SEPARATE"
  | "EXCLUDE_INELIGIBLE";

export type AdaptationConsolidationState = "CONSOLIDATED" | "NO_ELIGIBLE_PROPOSALS" | "FAIL_CLOSED";

export type AdaptationConsolidationFailure =
  | "PROPOSAL_VALIDATION_FAILED"
  | "SUPPRESSION_EVALUATION_UNAVAILABLE"
  | "NO_ELIGIBLE_PROPOSALS"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_ANALYSIS_UNAVAILABLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CONFLICTING_PROPOSALS_MERGE_ATTEMPT"
  | "DETERMINISTIC_CONSOLIDATION_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "PROPOSAL_INTENT_MUTATION_ATTEMPT"
  | "HISTORICAL_RECORD_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "OPERATOR_REVIEW_BYPASS_ATTEMPT"
  | "PROPOSAL_APPROVAL_ATTEMPT"
  | "PROPOSAL_REJECTION_ATTEMPT"
  | "PROPOSAL_SUPPRESSION_ATTEMPT"
  | "PROPOSAL_IMPLEMENTATION_ATTEMPT";

export type AdaptationConsolidationScenario =
  | "BASELINE"
  | "DUPLICATE"
  | "OVERLAPPING"
  | "COMPLEMENTARY"
  | "CONFLICTING"
  | "SEQUENTIAL"
  | "DEPENDENT"
  | "SUPPRESSED_INPUT"
  | "REWORK_INPUT"
  | "ANALYSIS_INPUT"
  | "INVALID_PROPOSAL"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "GOVERNANCE_UNAVAILABLE"
  | "INTEGRITY_FAILURE"
  | "NONDETERMINISTIC_CONSOLIDATION"
  | "TENANT_VIOLATION"
  | "INTENT_MUTATION_ATTEMPT"
  | "HISTORICAL_MUTATION_ATTEMPT"
  | "CONFLICT_MERGE_ATTEMPT"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_REVIEW_BYPASS"
  | "APPROVAL_ATTEMPT"
  | "REJECTION_ATTEMPT"
  | "SUPPRESSION_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT";

export type ConsolidationCandidate = Readonly<{
  candidate_id: string;
  proposal_id: string;
  generated_proposal_id: string;
  priority_id: string;
  suppression_decision_id: string;
  eligible_for_consolidation: boolean;
  exclusion_reason: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  scoring_refs: readonly string[];
  suppression_outcome: string;
  source_integrity_hash: string;
  integrity_hash: string;
}>;

export type ConsolidationRelationship = Readonly<{
  relationship_id: string;
  relationship_type: AdaptationRelationshipType;
  source_candidate_ids: readonly string[];
  detection_criteria: readonly string[];
  compatibility_validated: boolean;
  merge_allowed: boolean;
  requires_operator_review: boolean;
  requires_governance_review: boolean;
  rationale: string;
  integrity_hash: string;
}>;

export type ConsolidationLineage = Readonly<{
  original_proposal_ids: readonly string[];
  generated_proposal_ids: readonly string[];
  proposal_versions: readonly string[];
  evidence_lineage: readonly string[];
  outcome_lineage: readonly string[];
  replay_lineage: readonly string[];
  governance_lineage: readonly string[];
  operator_lineage: readonly string[];
  scoring_lineage: readonly string[];
  suppression_history: readonly string[];
  prioritization_history: readonly string[];
  integrity_hash: string;
}>;

export type ConsolidationExplanation = Readonly<{
  explanation_id: string;
  consolidated_proposal_id: string;
  relationship_type: AdaptationRelationshipType;
  action: AdaptationConsolidationAction;
  source_proposal_ids: readonly string[];
  consolidation_rationale: string;
  evidence_preservation_summary: string;
  replay_reconstruction_summary: string;
  governance_review_summary: string;
  operator_review_summary: string;
  non_authority_statement: string;
  decision_timestamp: string;
  decision_version: "adaptation-consolidation-rules/v1";
  integrity_hash: string;
}>;

export type ConsolidatedAdaptationProposal = Readonly<{
  consolidated_proposal_id: string;
  source_candidate_ids: readonly string[];
  source_proposal_ids: readonly string[];
  consolidation_timestamp: string;
  relationship_classifications: readonly AdaptationRelationshipType[];
  action: AdaptationConsolidationAction;
  consolidation_rationale: string;
  lineage: ConsolidationLineage;
  explanation: ConsolidationExplanation;
  replay_refs: readonly string[];
  consolidation_engine_version: "adaptation-consolidation-engine/v1";
  preserves_original_intent: true;
  preserves_historical_records: true;
  advisory_only: true;
  modifies_proposals: false;
  approves_proposals: false;
  rejects_proposals: false;
  suppresses_proposals: false;
  implements_proposals: false;
  integrity_hash: string;
}>;

export type AdaptationConsolidationMetrics = Readonly<{
  proposals_evaluated: number;
  proposals_eligible: number;
  proposals_consolidated: number;
  consolidated_recommendations: number;
  duplicate_detections: number;
  overlapping_relationships: number;
  complementary_relationships: number;
  conflicting_relationships: number;
  sequential_dependencies: number;
  dependent_relationships: number;
  consolidation_ratio: number;
  evidence_references_merged: number;
  replay_lineage_complete: boolean;
  consolidation_latency_ms: number;
  deterministic_replay_success: boolean;
  validation_failures: readonly AdaptationConsolidationFailure[];
  integrity_hash: string;
}>;

export type AdaptationConsolidationApiSurface = Readonly<{
  api_id: string;
  consolidate_proposals: "POST /adaptation-consolidation-engine/consolidate";
  retrieve_groups: "POST /adaptation-consolidation-engine/groups";
  retrieve_relationships: "POST /adaptation-consolidation-engine/relationships";
  retrieve_explanations: "POST /adaptation-consolidation-engine/explanations";
  retrieve_metrics: "POST /adaptation-consolidation-engine/metrics";
  replay_consolidation: "POST /adaptation-consolidation-engine/replay";
  inspect_consolidation: "POST /adaptation-consolidation-engine/inspect";
  retrieve_contract: "GET /adaptation-consolidation-engine/contract";
  proposal_mutation_supported: false;
  historical_record_mutation_supported: false;
  approval_supported: false;
  rejection_supported: false;
  suppression_supported: false;
  implementation_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdaptationConsolidationInput = Readonly<{
  scenario?: AdaptationConsolidationScenario;
  suppression_result?: AdaptationSuppressionResult;
}>;

export type AdaptationConsolidationResult = Readonly<{
  adaptation_consolidation_engine_version: "adaptation-consolidation-engine/v1";
  decision_version: "adaptation-consolidation-rules/v1";
  api_surface: AdaptationConsolidationApiSurface;
  suppression_result: AdaptationSuppressionResult;
  candidates: readonly ConsolidationCandidate[];
  relationships: readonly ConsolidationRelationship[];
  consolidated_proposals: readonly ConsolidatedAdaptationProposal[];
  metrics: AdaptationConsolidationMetrics;
  consolidation_state: AdaptationConsolidationState;
  failures: readonly AdaptationConsolidationFailure[];
  deterministic: true;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  evidence_lineage_complete: boolean;
  replay_lineage_complete: boolean;
  governance_lineage_complete: boolean;
  advisory_only: true;
  modifies_proposals: false;
  mutates_historical_records: false;
  approves_proposals: false;
  rejects_proposals: false;
  suppresses_proposals: false;
  implements_proposals: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdaptationConsolidationFoundation = Readonly<{
  adaptation_consolidation_engine_version: "adaptation-consolidation-engine/v1";
  supported_relationships: readonly AdaptationRelationshipType[];
  supported_actions: readonly AdaptationConsolidationAction[];
  api_surface: AdaptationConsolidationApiSurface;
  result: AdaptationConsolidationResult;
}>;

export type ConsolidatableSuppressionDecision = SuppressionDecision;
