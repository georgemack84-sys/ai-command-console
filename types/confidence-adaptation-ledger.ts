import type { ConfidenceAdaptationProposalResult } from "@/types/confidence-adaptation-proposal-generator";

export type ConfidenceLedgerEventType =
  | "PROPOSAL_CREATED"
  | "GOVERNANCE_REVIEW_RECORDED"
  | "SIMULATION_RECORDED"
  | "REPLAY_VALIDATED"
  | "OPERATOR_DECISION_RECORDED"
  | "CERTIFICATION_DECISION_RECORDED"
  | "ROLLBACK_PLAN_RECORDED"
  | "IMPLEMENTATION_DECISION_RECORDED";
export type ConfidenceLedgerSimulationStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "ARCHIVED";
export type ConfidenceLedgerCertificationStatus = "DRAFT" | "PENDING_REVIEW" | "SIMULATION_REQUIRED" | "REPLAY_REQUIRED" | "APPROVED" | "REJECTED" | "CERTIFIED" | "RETIRED";
export type ConfidencePatternCategory =
  | "OVERCONFIDENCE"
  | "UNDERCONFIDENCE"
  | "FALSE_CERTAINTY"
  | "FALSE_CAUTION"
  | "EVIDENCE_INFLATION"
  | "EVIDENCE_INSUFFICIENCY"
  | "UNKNOWN_UNCERTAINTY"
  | "PREDICTION_INSTABILITY"
  | "MISSION_SPECIFIC_BIAS"
  | "OPERATOR_SPECIFIC_CONFIDENCE_BEHAVIOR"
  | "DOMAIN_SPECIFIC_CALIBRATION_DRIFT"
  | "CONFIDENCE_SATURATION"
  | "CONFIDENCE_COLLAPSE";
export type ConfidenceAdaptationLedgerValidationState = "RECORDED" | "VERIFIED" | "FAILED" | "PENDING_REPLAY";

export type ConfidenceAdaptationLedgerFailure =
  | "PROPOSAL_REFERENCE_MISSING"
  | "SUPPORTING_EVIDENCE_MISSING"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "LINEAGE_CHAIN_INCOMPLETE"
  | "CERTIFICATION_HISTORY_MISSING"
  | "ROLLBACK_HISTORY_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "LEDGER_UPDATE_DETECTED"
  | "LEDGER_DELETE_DETECTED"
  | "PRODUCTION_CONFIDENCE_MUTATION_DETECTED"
  | "CONFIDENCE_MODEL_UPDATE_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "REPLAY_BYPASS_DETECTED"
  | "OPERATOR_APPROVAL_BYPASS_DETECTED"
  | "AUDIT_LOGGING_DISABLED"
  | "HISTORICAL_RECORD_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_LEDGER_RECORDING"
  | "FAIL_OPEN_BEHAVIOR";

export type ConfidenceAdaptationLedgerScenario =
  | "BASELINE"
  | "HIGH_RISK"
  | "ROLLBACK"
  | "CERTIFIED"
  | "REJECTED"
  | "ALL_PATTERNS"
  | "MISSING_PROPOSAL"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_REPLAY"
  | "MISSING_INTEGRITY"
  | "BROKEN_LINEAGE"
  | "MISSING_CERTIFICATION"
  | "MISSING_ROLLBACK"
  | "CROSS_TENANT"
  | "LEDGER_UPDATE"
  | "LEDGER_DELETE"
  | "PRODUCTION_MUTATION"
  | "MODEL_UPDATE"
  | "GOVERNANCE_BYPASS"
  | "REPLAY_BYPASS"
  | "OPERATOR_APPROVAL_BYPASS"
  | "AUDIT_DISABLED"
  | "HISTORICAL_RECORD_MUTATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type ConfidenceAdaptationLedgerRecord = Readonly<{
  ledger_record_id: string;
  proposal_id: string;
  tenant_id: string;
  mission_scope: string;
  ledger_event_type: ConfidenceLedgerEventType;
  event_timestamp: string;
  proposal_version: string;
  governance_status: string;
  operator_status: string;
  simulation_status: ConfidenceLedgerSimulationStatus;
  certification_status: ConfidenceLedgerCertificationStatus;
  rollback_status: "PLANNED" | "APPROVED" | "EXECUTED" | "VERIFIED" | "NOT_REQUIRED";
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  updated: boolean;
  deleted: boolean;
  advisory_only: true;
  modifies_production_confidence: false;
  updates_confidence_model: false;
  mutates_historical_records: false;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationLineage = Readonly<{
  lineage_id: string;
  proposal_id: string;
  parent_proposal_id: string | null;
  child_proposal_ids: readonly string[];
  calibration_version: string;
  superseded_by: string | null;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceReplayRecord = Readonly<{
  replay_record_id: string;
  proposal_id: string;
  replay_version: string;
  historical_confidence_refs: readonly string[];
  evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  governance_refs: readonly string[];
  simulation_refs: readonly string[];
  approval_refs: readonly string[];
  replay_verification_status: "VERIFIED" | "FAILED" | "PENDING";
  integrity_hash: string;
}>;

export type ConfidenceCertificationRecord = Readonly<{
  certification_id: string;
  proposal_id: string;
  certification_status: ConfidenceLedgerCertificationStatus;
  certification_version: string;
  reviewer_refs: readonly string[];
  simulation_result: ConfidenceLedgerSimulationStatus;
  replay_result: "VERIFIED" | "FAILED" | "PENDING";
  approval_result: "APPROVED" | "REJECTED" | "PENDING";
  certification_timestamp: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceRollbackRecord = Readonly<{
  rollback_id: string;
  proposal_id: string;
  rollback_plan: string;
  rollback_triggers: readonly string[];
  rollback_approvals: readonly string[];
  rollback_status: "PLANNED" | "APPROVED" | "EXECUTED" | "VERIFIED";
  recovery_validation_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceAdaptationLedgerRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  ledger_record_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_record_refs: readonly string[];
  certification_record_refs: readonly string[];
  rollback_record_refs: readonly string[];
  preserved_patterns: readonly ConfidencePatternCategory[];
  event_index: Readonly<Record<ConfidenceLedgerEventType, readonly string[]>>;
  pattern_index: Readonly<Record<ConfidencePatternCategory, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationLedgerValidation = Readonly<{
  validation_id: string;
  state: ConfidenceAdaptationLedgerValidationState;
  verified: boolean;
  failures: readonly ConfidenceAdaptationLedgerFailure[];
  proposal_referenced: boolean;
  evidence_complete: boolean;
  governance_complete: boolean;
  replay_complete: boolean;
  integrity_complete: boolean;
  lineage_complete: boolean;
  certification_complete: boolean;
  rollback_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  append_only: boolean;
  immutable: boolean;
  audit_logging_enabled: boolean;
  advisory_only: boolean;
  no_production_confidence_mutation: boolean;
  no_model_update: boolean;
  no_historical_record_mutation: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationLedgerApiSurface = Readonly<{
  api_id: string;
  record_ledger: "POST /confidence-adaptation-ledger/analyze";
  retrieve_records: "POST /confidence-adaptation-ledger/records";
  retrieve_proposal_history: "POST /confidence-adaptation-ledger/proposal-history";
  retrieve_governance: "POST /confidence-adaptation-ledger/governance";
  retrieve_simulation: "POST /confidence-adaptation-ledger/simulation";
  retrieve_lineage: "POST /confidence-adaptation-ledger/lineage";
  retrieve_replay_lineage: "POST /confidence-adaptation-ledger/replay-lineage";
  retrieve_certification: "POST /confidence-adaptation-ledger/certification";
  retrieve_rollback: "POST /confidence-adaptation-ledger/rollback";
  retrieve_patterns: "POST /confidence-adaptation-ledger/patterns";
  retrieve_registry: "POST /confidence-adaptation-ledger/registry";
  verify_ledger: "POST /confidence-adaptation-ledger/verify";
  replay_analysis: "POST /confidence-adaptation-ledger/replay";
  retrieve_contract: "GET /confidence-adaptation-ledger/contract";
  update_supported: false;
  delete_supported: false;
  production_confidence_mutation_supported: false;
  model_update_supported: false;
  historical_record_mutation_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationLedgerInput = Readonly<{
  scenario?: ConfidenceAdaptationLedgerScenario;
  proposal_result?: ConfidenceAdaptationProposalResult;
}>;

export type ConfidenceAdaptationLedgerResult = Readonly<{
  confidence_adaptation_ledger_version: "confidence-adaptation-ledger/v1";
  api_surface: ConfidenceAdaptationLedgerApiSurface;
  ledger_records: readonly ConfidenceAdaptationLedgerRecord[];
  calibration_lineage: ConfidenceCalibrationLineage;
  replay_record: ConfidenceReplayRecord;
  certification_record: ConfidenceCertificationRecord;
  rollback_record: ConfidenceRollbackRecord;
  registry: ConfidenceAdaptationLedgerRegistry;
  validation: ConfidenceAdaptationLedgerValidation;
  deterministic: true;
  replayable: true;
  audit_ready: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  append_only: true;
  immutable: true;
  modifies_production_confidence: false;
  updates_confidence_model: false;
  mutates_historical_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceAdaptationLedgerFoundation = Readonly<{
  confidence_adaptation_ledger_version: "confidence-adaptation-ledger/v1";
  api_surface: ConfidenceAdaptationLedgerApiSurface;
  result: ConfidenceAdaptationLedgerResult;
}>;
