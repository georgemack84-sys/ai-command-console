export type SpecificationIntegrityStatus = "NOT_VALIDATED" | "VALIDATING" | "VALID" | "INVALID" | "REQUIRES_RECONCILIATION";
export type SpecificationConsistencyOutcome = "PASS" | "FAIL" | "REQUIRES_RECONCILIATION";

export type SpecificationIntegrityFailure =
  | "VOCABULARY_DRIFT"
  | "DUPLICATE_DEFINITION"
  | "UNDEFINED_TERMINOLOGY"
  | "BROKEN_REFERENCE"
  | "CIRCULAR_REFERENCE_UNGOVERNED"
  | "SEMANTIC_CONTRADICTION"
  | "AUTHORITY_EXPANSION"
  | "LIFECYCLE_AMBIGUITY"
  | "DEPENDENCY_UNRESOLVED"
  | "REPLAY_INCONSISTENT"
  | "CERTIFICATION_CONFLICT"
  | "DOCUMENT_TAXONOMY_CONFLICT"
  | "LINEAGE_INCOMPLETE"
  | "AMENDMENT_INCONSISTENT"
  | "ADDENDUM_INVALIDATES_BEHAVIOR"
  | "AUDIT_LEDGER_MUTABLE";

export type SpecificationIntegrityScenario = "BASELINE" | SpecificationIntegrityFailure;
export type SpecificationIntegrityInput = Readonly<{ scenario?: SpecificationIntegrityScenario; tenant_id?: string }>;

export type SpecificationIntegrityContract = Readonly<{
  integrity_id: string;
  specification_ref: string;
  specification_version: string;
  validation_scope: readonly string[];
  validation_timestamp: string;
  validator_version: "specification-integrity-consistency-validation/v13.11";
  integrity_status: SpecificationIntegrityStatus;
  detected_inconsistencies: readonly SpecificationIntegrityFailure[];
  evidence_refs: readonly string[];
  constitutional_compliance: boolean;
  replay_compliance: boolean;
  certification_status: SpecificationConsistencyOutcome;
  integrity_hash: string;
}>;

export type DomainConsistencyReport = Readonly<{
  report_id: string;
  domain:
    | "VOCABULARY"
    | "CROSS_REFERENCE"
    | "SEMANTIC"
    | "CONSTITUTIONAL"
    | "LIFECYCLE"
    | "DEPENDENCY"
    | "REPLAY_CERTIFICATION"
    | "DOCUMENT_TAXONOMY";
  checked_items: readonly string[];
  outcome: SpecificationConsistencyOutcome;
  findings: readonly SpecificationIntegrityFailure[];
  evidence_refs: readonly string[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SpecificationIntegrityRegistry = Readonly<{
  registry_id: string;
  integrity_records: readonly string[];
  validation_history: readonly string[];
  semantic_findings: readonly string[];
  reconciliation_history: readonly string[];
  validator_versions: readonly string[];
  evidence_references: readonly string[];
  replay_references: readonly string[];
  certification_references: readonly string[];
  immutable: boolean;
  historical_integrity_replayable: boolean;
  integrity_hash: string;
}>;

export type SpecificationIntegrityLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "VALIDATION_EXECUTION" | "INCONSISTENCY_DETECTED" | "RECONCILIATION_DECISION" | "VOCABULARY_CHANGE" | "REFERENCE_CORRECTION" | "SEMANTIC_UPDATE" | "CERTIFICATION_IMPACT" | "REPLAY_IMPACT";
  integrity_id: string;
  evidence_refs: readonly string[];
  sequence: number;
  append_only: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SpecificationIntegrityValidationResult = Readonly<{
  phase_version: "specification-integrity-consistency-validation/v13.11";
  phase_identifier: "SpecificationIntegrityConsistencyValidation";
  contract: SpecificationIntegrityContract;
  vocabulary_validation: DomainConsistencyReport;
  cross_reference_validation: DomainConsistencyReport;
  semantic_integrity: DomainConsistencyReport;
  constitutional_consistency: DomainConsistencyReport;
  lifecycle_consistency: DomainConsistencyReport;
  dependency_consistency: DomainConsistencyReport;
  replay_certification_consistency: DomainConsistencyReport;
  document_taxonomy_consistency: DomainConsistencyReport;
  integrity_registry: SpecificationIntegrityRegistry;
  integrity_ledger: readonly SpecificationIntegrityLedgerEntry[];
  replay_hash: string;
  integrity_hash: string;
}>;

export type SpecificationIntegrityValidation = Readonly<{
  valid: boolean;
  outcome: SpecificationConsistencyOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  domains_valid: boolean;
  registry_valid: boolean;
  ledger_valid: boolean;
  failures: readonly SpecificationIntegrityFailure[];
  integrity_hash: string;
}>;

export type SpecificationIntegrityBundle = Readonly<{
  doctrine: Readonly<{
    version: "specification-integrity-consistency-validation/v13.11";
    validation_states: readonly SpecificationIntegrityStatus[];
    validation_domains: readonly string[];
    reconciliation_required_for_conflicts: true;
    deterministic_validation_required: true;
    immutable_evidence_required: true;
    replay_preservation_required: true;
    audit_immutability_required: true;
    mission_control_change_authority: false;
  }>;
  result: SpecificationIntegrityValidationResult;
  validation: SpecificationIntegrityValidation;
}>;
