import type { AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { DeterministicMaturityScoringRepository } from "@/types/deterministic-maturity-scoring-engine";

export type MaturityClassificationScenario = "BASELINE" | "UNDEFINED_THRESHOLDS" | "INCONSISTENT_CLASSIFICATION_RULES" | "UNAUTHORIZED_PROMOTION" | "MISSED_REGRESSION_TRIGGER" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "AUTHORITY_ENFORCEMENT_FAILURE" | "REPLAY_RECONSTRUCTION_MISMATCH" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_CLASSIFICATION_LOGIC" | "NONDETERMINISTIC_LEVEL_ASSIGNMENT" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type MaturityClassificationFailure = "MATURITY_THRESHOLDS_UNDEFINED" | "CLASSIFICATION_RULES_INCONSISTENT" | "PROMOTION_WITHOUT_PREREQUISITES" | "REGRESSION_TRIGGER_MISSED" | "GOVERNANCE_VALIDATION_FAILED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "AUTHORITY_ENFORCEMENT_FAILED" | "REPLAY_RECONSTRUCTION_MISMATCHED" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_CLASSIFICATION_LOGIC_DETECTED" | "NONDETERMINISTIC_LEVEL_ASSIGNMENT_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type MaturityClassificationState = "UNCLASSIFIED" | "ASSISTED_EXECUTION" | "GUIDED_AUTONOMY" | "CONTROLLED_AUTONOMY" | "RESILIENT_AUTONOMY" | "CERTIFIED_CONSTITUTIONAL_AUTONOMY" | "REGRESSION_PENDING" | "RECERTIFICATION_REQUIRED";
export type MaturityTransitionDecision = "NO_CHANGE" | "PROMOTION_ELIGIBLE" | "REGRESSION_ADVISED" | "RECERTIFICATION_ADVISED" | "BLOCKED";

export type MaturityClassificationRule = Readonly<{
  rule_id: string;
  level: AutonomyMaturityLevel;
  state: MaturityClassificationState;
  min_score: number;
  min_confidence: number;
  min_readiness: number;
  required_conditions: readonly string[];
  prohibited_conditions: readonly string[];
  approved: boolean;
  integrity_hash: string;
}>;

export type MaturityTransitionEvaluation = Readonly<{
  transition_id: string;
  from_level: AutonomyMaturityLevel;
  to_level: AutonomyMaturityLevel;
  decision: MaturityTransitionDecision;
  promotion_eligible: boolean;
  regression_advised: boolean;
  prerequisites_satisfied: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  authority_enforced: boolean;
  replay_verified: boolean;
  certification_ready: boolean;
  rationale: readonly string[];
  advisory_only: true;
  promotion_authorized: false;
  regression_authorized: false;
  integrity_hash: string;
}>;

export type MaturityClassificationRecord = Readonly<{
  classification_id: string;
  assessment_id: string;
  classification_version: "maturity-classification-engine/v8ALT.11.4";
  rule_set_version: "maturity-classification-rules/v1";
  maturity_level: AutonomyMaturityLevel;
  classification_state: MaturityClassificationState;
  classification_confidence: number;
  readiness_status: string;
  applied_rules: readonly string[];
  domain_summaries: readonly string[];
  explanation: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  governance_validated: boolean;
  constitutional_validated: boolean;
  authority_enforced: boolean;
  integrity_hash: string;
}>;

export type MaturityClassificationLedgerEntry = Readonly<{
  ledger_id: string;
  classification_id: string;
  assessment_id: string;
  maturity_level: AutonomyMaturityLevel;
  classification_version: "maturity-classification-engine/v8ALT.11.4";
  rule_set_version: "maturity-classification-rules/v1";
  transition_id: string;
  transition_decision: MaturityTransitionDecision;
  evidence_references: readonly string[];
  governance_reference: string;
  constitutional_reference: string;
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  append_only: true;
  integrity_hash: string;
}>;

export type MaturityClassificationRepository = Readonly<{
  classification_id: string;
  final_state: "MATURITY_CLASSIFICATION_COMPLETE" | "MATURITY_CLASSIFICATION_FAILED";
  scoring: DeterministicMaturityScoringRepository;
  rules: readonly MaturityClassificationRule[];
  record: MaturityClassificationRecord;
  transition: MaturityTransitionEvaluation;
  ledger: readonly MaturityClassificationLedgerEntry[];
  failures: readonly MaturityClassificationFailure[];
  advisory_only: true;
  promotion_authorized: false;
  regression_authorized: false;
  maturity_advancement_authorized: false;
  production_certification_authorized: false;
  governance_modification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityClassificationValidationResult = Readonly<{
  classification_id: string;
  valid: boolean;
  thresholds_defined: boolean;
  rules_consistent: boolean;
  no_unauthorized_promotion: boolean;
  regression_detection_valid: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  authority_enforced: boolean;
  replay_verified: boolean;
  integrity_verified: boolean;
  no_hidden_logic: boolean;
  deterministic_level_assignment: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  no_execution_authority: boolean;
  failures: readonly MaturityClassificationFailure[];
  validation_hash: string;
}>;

export type MaturityClassificationObservabilitySurface = Readonly<{
  classification_id: string;
  final_state: string;
  maturity_level: AutonomyMaturityLevel;
  classification_state: MaturityClassificationState;
  transition_decision: MaturityTransitionDecision;
  rule_count: number;
  ledger_count: number;
  failure_count: number;
  advisory_only: true;
  promotion_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type MaturityClassificationInput = Readonly<{ scenario?: MaturityClassificationScenario; repository?: MaturityClassificationRepository; scoring?: DeterministicMaturityScoringRepository }>;

export type MaturityClassificationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "maturity-classification-engine/v8ALT.11.4";
    final_state: "MATURITY_CLASSIFICATION_ENGINE_READY";
    level_count: 5;
    principles: readonly string[];
  }>;
  repository: MaturityClassificationRepository;
  validation: MaturityClassificationValidationResult;
  observability: MaturityClassificationObservabilitySurface;
}>;
