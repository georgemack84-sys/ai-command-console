import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeObservationEngineResult } from "@/types/outcome-observation-engine";

export type OutcomeEvidenceLifecycleState = "DISCOVERED" | "REGISTERED" | "VALIDATED" | "LINKED" | "RECORDED" | "REPLAYABLE";

export type OutcomeEvidenceType =
  | "OPERATIONAL_REPORT"
  | "OPERATOR_EVIDENCE"
  | "GOVERNANCE_EVIDENCE"
  | "MISSION_EVIDENCE"
  | "ROLLBACK_EVIDENCE"
  | "AUDIT_REFERENCE"
  | "SIMULATION_REFERENCE"
  | "EXTERNAL_VERIFIED_EVIDENCE";

export type OutcomeEvidenceLinkType =
  | "OUTCOME_TO_EVIDENCE"
  | "DECISION_TO_EVIDENCE"
  | "MISSION_TO_EVIDENCE"
  | "OPERATOR_TO_EVIDENCE"
  | "GOVERNANCE_TO_EVIDENCE"
  | "ROLLBACK_TO_EVIDENCE"
  | "REPLAY_TO_EVIDENCE"
  | "TRUTH_LEDGER_TO_EVIDENCE";

export type OutcomeEvidenceRegistryCheck =
  | "OBSERVATION_VALIDATION"
  | "EVIDENCE_IDENTITY"
  | "EVIDENCE_SOURCE"
  | "EVIDENCE_EXISTENCE"
  | "EVIDENCE_LINKING"
  | "EVIDENCE_LINEAGE"
  | "EVIDENCE_INTEGRITY"
  | "GOVERNANCE_TRACEABILITY"
  | "REPLAY_RECONSTRUCTION"
  | "RELATIONSHIP_DETERMINISM"
  | "LEDGER_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type OutcomeEvidenceRegistryFailure =
  | "OUTCOME_ACCEPTED_WITHOUT_EVIDENCE"
  | "EVIDENCE_REFERENCE_MISSING"
  | "DUPLICATE_EVIDENCE_ID_ACCEPTED"
  | "UNAUTHORIZED_EVIDENCE_SOURCE_ACCEPTED"
  | "EVIDENCE_INTEGRITY_VERIFICATION_FAILED"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "LINEAGE_GRAPH_BROKEN"
  | "EVIDENCE_RELATIONSHIP_NONDETERMINISTIC"
  | "EVIDENCE_MODIFIED_AFTER_REGISTRATION"
  | "TENANT_ISOLATION_VIOLATED"
  | "ORPHAN_EVIDENCE_RECORD_CREATED"
  | "OBSERVATION_NOT_VALIDATED"
  | "EVIDENCE_INFERRED"
  | "ORIGINAL_EVIDENCE_ALTERED"
  | "CONSTITUTIONAL_GOVERNANCE_BYPASSED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_EVIDENCE_REGISTRY_BEHAVIOR";

export type OutcomeEvidenceRecord = Readonly<{
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  decision_id: string;
  evidence_type: OutcomeEvidenceType;
  evidence_source: string;
  source_record_id: string;
  observation_timestamp: string;
  evidence_summary: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  immutable_reference: true;
  original_evidence_altered: false;
  integrity_hash: string;
}>;

export type OutcomeEvidenceLink = Readonly<{
  link_id: string;
  link_type: OutcomeEvidenceLinkType;
  evidence_id: string;
  source_ref: string;
  target_ref: string;
  deterministic_order: number;
  integrity_hash: string;
}>;

export type OutcomeEvidenceLineage = Readonly<{
  lineage_id: string;
  evidence_id: string;
  parent_refs: readonly string[];
  child_refs: readonly string[];
  supporting_refs: readonly string[];
  conflicting_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OutcomeEvidenceValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  identity_valid: boolean;
  source_valid: boolean;
  evidence_exists: boolean;
  evidence_not_inferred: boolean;
  integrity_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  lineage_complete: boolean;
  relationships_deterministic: boolean;
  tenant_isolated: boolean;
  immutable_after_registration: boolean;
  original_evidence_preserved: boolean;
  constitutional_governance_preserved: boolean;
  failures: readonly OutcomeEvidenceRegistryFailure[];
  integrity_hash: string;
}>;

export type OutcomeEvidenceRelationshipIndex = Readonly<{
  index_id: string;
  outcome_links: readonly OutcomeEvidenceLink[];
  decision_links: readonly OutcomeEvidenceLink[];
  mission_links: readonly OutcomeEvidenceLink[];
  operator_links: readonly OutcomeEvidenceLink[];
  governance_links: readonly OutcomeEvidenceLink[];
  rollback_links: readonly OutcomeEvidenceLink[];
  replay_links: readonly OutcomeEvidenceLink[];
  truth_ledger_links: readonly OutcomeEvidenceLink[];
  deterministic: true;
  integrity_hash: string;
}>;

export type OutcomeEvidenceReplayIndex = Readonly<{
  replay_index_id: string;
  evidence_ids: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  reconstruction_order: readonly string[];
  reconstruction_hash: string;
  integrity_hash: string;
}>;

export type OutcomeEvidenceLedgerRecord = Readonly<{
  ledger_id: string;
  evidence_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  lifecycle_state: OutcomeEvidenceLifecycleState;
  evidence_hash: string;
  relationship_hash: string;
  lineage_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OutcomeEvidenceMetrics = Readonly<{
  metrics_id: string;
  evidence_records_registered: number;
  evidence_records_rejected: number;
  evidence_by_category: readonly OutcomeEvidenceType[];
  missing_evidence_detections: number;
  integrity_validation_failures: number;
  lineage_completeness_score: number;
  replay_reconstruction_success_rate: number;
  duplicate_evidence_attempts: number;
  orphan_evidence_attempts: number;
  registry_processing_latency_ms: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeEvidenceAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeEvidenceRegistryCheck[];
  registry_operational: boolean;
  linker_operational: boolean;
  validator_operational: boolean;
  lineage_tracker_operational: boolean;
  relationship_index_operational: boolean;
  integrity_manager_operational: boolean;
  replay_index_operational: boolean;
  evidence_identities_deterministic: boolean;
  evidence_required_for_outcomes: boolean;
  evidence_references_immutable: boolean;
  orphan_evidence_prevented: boolean;
  original_evidence_unmodified: boolean;
  adaptive_intelligence_ready: boolean;
  failure_analysis: readonly OutcomeEvidenceRegistryFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeEvidenceRegistryInput = Readonly<{
  observation_engine?: OutcomeObservationEngineResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "OPERATIONAL_REPORT"
    | "OPERATOR_EVIDENCE"
    | "GOVERNANCE_EVIDENCE"
    | "MISSION_EVIDENCE"
    | "ROLLBACK_EVIDENCE"
    | "AUDIT_REFERENCE"
    | "SIMULATION_REFERENCE"
    | "EXTERNAL_VERIFIED_EVIDENCE"
    | "NO_EVIDENCE"
    | "MISSING_REFERENCE"
    | "DUPLICATE_EVIDENCE_ID"
    | "UNAUTHORIZED_SOURCE"
    | "INTEGRITY_FAILURE"
    | "MISSING_REPLAY"
    | "MISSING_GOVERNANCE"
    | "BROKEN_LINEAGE"
    | "NONDETERMINISTIC_RELATIONSHIP"
    | "MODIFIED_AFTER_REGISTRATION"
    | "TENANT_VIOLATION"
    | "ORPHAN_EVIDENCE"
    | "INVALID_OBSERVATION"
    | "INFERRED_EVIDENCE"
    | "ORIGINAL_EVIDENCE_ALTERED"
    | "CONSTITUTIONAL_BYPASS"
    | "FAIL_OPEN";
}>;

export type OutcomeEvidenceRegistryResult = Readonly<{
  outcome_evidence_registry_version: "outcome-evidence-registry/v1";
  observation_engine: OutcomeObservationEngineResult;
  evidence_registry: readonly OutcomeEvidenceRecord[];
  relationship_index: OutcomeEvidenceRelationshipIndex;
  lineage_tracker: readonly OutcomeEvidenceLineage[];
  replay_index: OutcomeEvidenceReplayIndex;
  validation: OutcomeEvidenceValidation;
  evidence_ledger: readonly OutcomeEvidenceLedgerRecord[];
  metrics: OutcomeEvidenceMetrics;
  audit_report: OutcomeEvidenceAuditReport;
  lifecycle: readonly OutcomeEvidenceLifecycleState[];
  deterministic: true;
  replayable: true;
  registry_only: true;
  creates_evidence: false;
  permits_inference: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeEvidenceRegistryFoundation = Readonly<{
  outcome_evidence_registry_version: "outcome-evidence-registry/v1";
  checks: readonly OutcomeEvidenceRegistryCheck[];
  evidence_types: readonly OutcomeEvidenceType[];
  lifecycle: readonly OutcomeEvidenceLifecycleState[];
  result: OutcomeEvidenceRegistryResult;
}>;
