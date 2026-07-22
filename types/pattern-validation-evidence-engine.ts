import type { PatternDetectionResult } from "@/types/pattern-detection-engine";

export type PatternValidationState = "PENDING" | "VALIDATING" | "VALIDATED" | "LOW_CONFIDENCE_PATTERN" | "REJECTED";
export type PatternValidationResultCode = "ACCEPTED" | "LOW_CONFIDENCE_PATTERN" | "REJECTED";
export type PatternRejectionReason =
  | "INSUFFICIENT_EVIDENCE"
  | "INSUFFICIENT_RECURRENCE"
  | "INCONSISTENT_HISTORY"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "UNSUPPORTED_EVIDENCE"
  | "MISSING_LINEAGE"
  | "UNEXPLAINED_VALIDATION";

export type PatternValidationFailure =
  | "DETECTION_INVALID"
  | "INSUFFICIENT_EVIDENCE"
  | "CORRUPTED_EVIDENCE"
  | "UNSUPPORTED_EVIDENCE"
  | "SUPPORT_THRESHOLD_UNMET"
  | "RECURRENCE_THRESHOLD_UNMET"
  | "HISTORICAL_INCONSISTENCY"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "MISSING_LINEAGE"
  | "EXPLANATION_MISSING"
  | "REGISTRY_MUTATION_DETECTED"
  | "AUTONOMOUS_BEHAVIOR_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternValidationScenario =
  | "BASELINE"
  | "WEAK_PATTERN"
  | "DETECTION_INVALID"
  | "MISSING_EVIDENCE"
  | "CORRUPTED_EVIDENCE"
  | "UNSUPPORTED_EVIDENCE"
  | "WEAK_SUPPORT"
  | "LOW_RECURRENCE"
  | "HISTORICAL_INCONSISTENCY"
  | "MISSING_GOVERNANCE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "MISSING_LINEAGE"
  | "MISSING_EXPLANATION"
  | "REGISTRY_MUTATION"
  | "AUTONOMOUS_BEHAVIOR"
  | "FAIL_OPEN";

export type ValidationMetric = Readonly<{
  metric_id: string;
  score: number;
  threshold: number;
  passed: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type PatternValidationRecord = Readonly<{
  validation_id: string;
  pattern_id: string;
  tenant_id: string;
  validation_timestamp: string;
  evidence_validation_result: ValidationMetric;
  support_validation_result: ValidationMetric;
  recurrence_validation_result: ValidationMetric;
  historical_consistency_result: ValidationMetric;
  governance_traceability_result: ValidationMetric;
  replay_integrity_result: ValidationMetric;
  validation_state: PatternValidationState;
  validation_result: PatternValidationResultCode;
  validation_summary: string;
  validation_rule_version: "pattern-validation-rule/v1";
  weak_pattern_detected: boolean;
  rejection_reason: PatternRejectionReason | "NONE";
  replay_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  advisory_only: true;
  modifies_recommendations: false;
  modifies_governance: false;
  adaptive_behavior: false;
  integrity_hash: string;
}>;

export type PatternValidationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  validation_refs: readonly string[];
  accepted_pattern_refs: readonly string[];
  low_confidence_pattern_refs: readonly string[];
  rejected_pattern_refs: readonly string[];
  rejection_reasons: readonly PatternRejectionReason[];
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type PatternValidationEvidenceValidation = Readonly<{
  validation_id: string;
  state: PatternValidationState;
  valid: boolean;
  failures: readonly PatternValidationFailure[];
  evidence_complete: boolean;
  support_sufficient: boolean;
  recurrence_valid: boolean;
  historical_consistent: boolean;
  governance_traceable: boolean;
  replay_validated: boolean;
  tenant_isolated: boolean;
  lineage_complete: boolean;
  explanations_complete: boolean;
  registry_immutable: boolean;
  integrity_verified: boolean;
  advisory_only: boolean;
  no_adaptive_behavior: boolean;
  integrity_hash: string;
}>;

export type PatternValidationApiSurface = Readonly<{
  api_id: string;
  validate_pattern: "POST /pattern-validation-evidence-engine/validate";
  validate_evidence: "POST /pattern-validation-evidence-engine/evidence";
  validate_support: "POST /pattern-validation-evidence-engine/support";
  validate_recurrence: "POST /pattern-validation-evidence-engine/recurrence";
  retrieve_registry: "POST /pattern-validation-evidence-engine/registry";
  replay_validation: "POST /pattern-validation-evidence-engine/replay";
  retrieve_contract: "GET /pattern-validation-evidence-engine/contract";
  update_supported: false;
  delete_supported: false;
  adaptive_behavior_supported: false;
  strategic_scoring_supported: false;
  integrity_hash: string;
}>;

export type PatternValidationInput = Readonly<{
  detection_result?: PatternDetectionResult;
  scenario?: PatternValidationScenario;
}>;

export type PatternValidationEvidenceResult = Readonly<{
  pattern_validation_evidence_engine_version: "pattern-validation-evidence-engine/v1";
  detection_result: PatternDetectionResult;
  api_surface: PatternValidationApiSurface;
  validation_records: readonly PatternValidationRecord[];
  registry: PatternValidationRegistry;
  validation: PatternValidationEvidenceValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  governance_first: true;
  adaptive_behavior: false;
  modifies_recommendations: false;
  modifies_priorities: false;
  modifies_governance: false;
  strategic_scoring: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternValidationEvidenceFoundation = Readonly<{
  pattern_validation_evidence_engine_version: "pattern-validation-evidence-engine/v1";
  api_surface: PatternValidationApiSurface;
  result: PatternValidationEvidenceResult;
}>;
