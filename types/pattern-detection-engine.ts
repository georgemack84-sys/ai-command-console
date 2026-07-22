import type { PatternCandidateBuilderResult, PatternWindow } from "@/types/pattern-candidate-builder";
import type { PatternType } from "@/types/pattern-intelligence-contract";

export type PatternClassification = PatternType | "LOW_CONFIDENCE_PATTERN";
export type PatternDetectionState = "CANDIDATES_RECEIVED" | "RULES_APPLIED" | "CORRELATION_COMPLETE" | "CLASSIFIED" | "REGISTERED" | "REPLAY_REGISTERED" | "READY_FOR_VALIDATION" | "FAILED" | "PENDING_EVIDENCE";
export type GovernanceRelevance = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type StrategicRelevance = "LOW" | "MEDIUM" | "HIGH";

export type PatternDetectionFailure =
  | "CANDIDATE_BUILDER_INVALID"
  | "REQUIRED_EVIDENCE_MISSING"
  | "RECURRENCE_THRESHOLD_UNMET"
  | "REPLAY_REFERENCES_INCOMPLETE"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_RULE_VIOLATED"
  | "UNSUPPORTED_PATTERN_TYPE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_BOUNDARY_VIOLATED"
  | "EXPLANATION_MISSING"
  | "RANDOMNESS_DETECTED"
  | "HIDDEN_OPTIMIZATION_DETECTED"
  | "AUTONOMOUS_LEARNING_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternDetectionScenario =
  | "BASELINE"
  | "RECOMMENDATION_SUCCESS"
  | "RISK_UNDERESTIMATION"
  | "RISK_OVERESTIMATION"
  | "CONFIDENCE_DRIFT"
  | "GOVERNANCE_BLOCKER"
  | "OPERATOR_OVERRIDE"
  | "EVIDENCE_GAP"
  | "MISSION_BOTTLENECK"
  | "DEPENDENCY_CONFLICT"
  | "SIMULATION_ERROR"
  | "ROLLBACK"
  | "STRATEGIC_OPPORTUNITY"
  | "LOW_CONFIDENCE"
  | "INVALID_CANDIDATE"
  | "MISSING_EVIDENCE"
  | "LOW_RECURRENCE"
  | "MISSING_REPLAY"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "UNSUPPORTED_PATTERN"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "MISSING_EXPLANATION"
  | "RANDOMNESS"
  | "HIDDEN_OPTIMIZATION"
  | "AUTONOMOUS_LEARNING"
  | "REGISTRY_MUTATION"
  | "FAIL_OPEN";

export type DetectionRule = Readonly<{
  rule_id: string;
  rule_version: "pattern-detection-rule/v1";
  pattern_type: PatternType;
  required_evidence_count: number;
  recurrence_threshold: number;
  classification_mapping: PatternClassification;
  governance_approved: true;
  deterministic: true;
  replayable: true;
  randomness_allowed: false;
  integrity_hash: string;
}>;

export type DetectedPattern = Readonly<{
  pattern_id: string;
  tenant_id: string;
  mission_scope: string;
  pattern_type: PatternType;
  pattern_classification: PatternClassification;
  pattern_summary: string;
  recurrence_count: number;
  recurrence_window: PatternWindow;
  detection_rule_version: "pattern-detection-rule/v1";
  supporting_candidate_refs: readonly string[];
  supporting_decision_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  supporting_governance_refs: readonly string[];
  governance_relevance: GovernanceRelevance;
  strategic_relevance: StrategicRelevance;
  operator_visibility_required: true;
  explanation: string;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  detection_timestamp: string;
  immutable: true;
  advisory_only: true;
  predicts_future_behavior: false;
  adaptive_learning: false;
  integrity_hash: string;
}>;

export type PatternDetectionRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  detected_pattern_refs: readonly string[];
  classification_index: Readonly<Record<string, readonly string[]>>;
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternDetectionValidation = Readonly<{
  validation_id: string;
  state: PatternDetectionState;
  valid: boolean;
  failures: readonly PatternDetectionFailure[];
  candidates_valid: boolean;
  rules_governance_approved: boolean;
  evidence_complete: boolean;
  recurrence_valid: boolean;
  replay_validated: boolean;
  governance_preserved: boolean;
  tenant_isolated: boolean;
  explanations_complete: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_autonomous_learning: boolean;
  integrity_hash: string;
}>;

export type PatternDetectionApiSurface = Readonly<{
  api_id: string;
  detect_patterns: "POST /pattern-detection-engine/detect";
  retrieve_rules: "POST /pattern-detection-engine/rules";
  classify_patterns: "POST /pattern-detection-engine/classify";
  retrieve_registry: "POST /pattern-detection-engine/registry";
  replay_detection: "POST /pattern-detection-engine/replay";
  verify_identity: "POST /pattern-detection-engine/identity";
  retrieve_contract: "GET /pattern-detection-engine/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_learning_supported: false;
  prediction_supported: false;
  integrity_hash: string;
}>;

export type PatternDetectionInput = Readonly<{
  candidate_result?: PatternCandidateBuilderResult;
  scenario?: PatternDetectionScenario;
}>;

export type PatternDetectionResult = Readonly<{
  pattern_detection_engine_version: "pattern-detection-engine/v1";
  candidate_result: PatternCandidateBuilderResult;
  api_surface: PatternDetectionApiSurface;
  rules: readonly DetectionRule[];
  detected_patterns: readonly DetectedPattern[];
  registry: PatternDetectionRegistry;
  validation: PatternDetectionValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_first: true;
  adaptive_learning: false;
  predicts_future_behavior: false;
  modifies_recommendations: false;
  modifies_priorities: false;
  modifies_confidence: false;
  modifies_governance_policy: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternDetectionFoundation = Readonly<{
  pattern_detection_engine_version: "pattern-detection-engine/v1";
  api_surface: PatternDetectionApiSurface;
  result: PatternDetectionResult;
}>;
