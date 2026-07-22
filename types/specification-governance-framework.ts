export type SpecificationLifecycleState = "DRAFT" | "REVIEW" | "APPROVED" | "ACTIVE" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";
export type SpecificationCertificationOutcome = "PASS" | "FAIL" | "PRUNED";
export type SpecificationIntegrityOutcome = "VERIFIED" | "MODIFIED" | "MISSING" | "INVALID" | "UNVERIFIABLE";

export type SpecificationGovernanceFailure =
  | "MUTABLE_APPROVED_VERSION"
  | "DUPLICATE_SPECIFICATION_ID"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "UNAPPROVED_CHANGE"
  | "OWNERSHIP_NOT_UNIQUE"
  | "OWNERSHIP_TRANSFER_UNAPPROVED"
  | "VERSION_LINEAGE_INCOMPLETE"
  | "DEPENDENCY_COMPATIBILITY_INVALID"
  | "SUPERSESSION_HISTORY_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "GOVERNANCE_LEDGER_MUTABLE"
  | "CERTIFICATION_PRUNED";

export type SpecificationGovernanceScenario = "BASELINE" | SpecificationGovernanceFailure;
export type SpecificationGovernanceInput = Readonly<{ scenario?: SpecificationGovernanceScenario; tenant_id?: string }>;

export type SpecificationArtifact = Readonly<{
  specification_id: string;
  specification_name: string;
  specification_type: string;
  owner_id: string;
  current_version: string;
  lifecycle_state: SpecificationLifecycleState;
  status: "GOVERNED" | "BLOCKED";
  parent_specification_refs: readonly string[];
  dependent_specification_refs: readonly string[];
  superseded_by: string | null;
  supersedes: readonly string[];
  approval_refs: readonly string[];
  change_history_refs: readonly string[];
  governance_refs: readonly string[];
  lineage_refs: readonly string[];
  created_timestamp: string;
  approved_timestamp: string | null;
  effective_timestamp: string | null;
  retired_timestamp: string | null;
  origin_ref: string;
  integrity_hash: string;
}>;

export type SpecificationRegistry = Readonly<{
  registry_id: string;
  specifications: readonly SpecificationArtifact[];
  identity_assignment_deterministic: boolean;
  identities_unique: boolean;
  immutable_registration: boolean;
  complete_inventory: boolean;
  replay_lookup_supported: boolean;
  integrity_hash: string;
}>;

export type SpecificationLifecycleContract = Readonly<{
  lifecycle_contract_id: string;
  lifecycle_states: readonly SpecificationLifecycleState[];
  legal_transitions: readonly string[];
  current_state: SpecificationLifecycleState;
  target_state: SpecificationLifecycleState;
  transition_legal: boolean;
  governance_approval_valid: boolean;
  dependency_compatibility_valid: boolean;
  ownership_authorized: boolean;
  integrity_preserved: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type VersionGovernanceRecord = Readonly<{
  version_record_id: string;
  specification_id: string;
  version: string;
  permanent_identifier: string;
  immutable_after_approval: boolean;
  lineage_refs: readonly string[];
  compatibility_valid: boolean;
  dependency_impact_refs: readonly string[];
  rollback_refs: readonly string[];
  replay_restoration_supported: boolean;
  integrity_hash: string;
}>;

export type SpecificationOwnershipRecord = Readonly<{
  ownership_record_id: string;
  specification_id: string;
  canonical_owner_id: string;
  governance_authority_id: string;
  approval_chain_ref: string;
  accountability_record_ref: string;
  owner_count: number;
  transfer_governance_approved: boolean;
  historical_owners: readonly string[];
  integrity_hash: string;
}>;

export type SpecificationChangeApproval = Readonly<{
  approval_workflow_id: string;
  proposed_change_ref: string;
  rationale_ref: string;
  impact_assessment_ref: string;
  affected_specification_refs: readonly string[];
  dependency_analysis_ref: string;
  replay_impact_ref: string;
  governance_approval_ref: string;
  approval_authority_ref: string;
  approval_decision: "APPROVED" | "REJECTED";
  version_registration_ref: string;
  registry_update_ref: string;
  lifecycle_update_ref: string;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SpecificationSupersessionRecord = Readonly<{
  supersession_id: string;
  superseded_specification_id: string;
  replacement_specification_id: string;
  previous_version_immutable: boolean;
  historical_replay_preserved: boolean;
  historical_validity_preserved: boolean;
  dependency_migration_refs: readonly string[];
  lineage_continuation_refs: readonly string[];
  replay_compatibility_valid: boolean;
  immutable_relationship: boolean;
  integrity_hash: string;
}>;

export type SpecificationIntegrityValidation = Readonly<{
  validation_id: string;
  integrity_hash_verification: SpecificationIntegrityOutcome;
  ownership_validation: SpecificationIntegrityOutcome;
  lifecycle_consistency: SpecificationIntegrityOutcome;
  version_integrity: SpecificationIntegrityOutcome;
  dependency_consistency: SpecificationIntegrityOutcome;
  replay_reconstruction: SpecificationIntegrityOutcome;
  governance_evidence_validation: SpecificationIntegrityOutcome;
  constitutional_assurance_event: boolean;
  failures: readonly SpecificationGovernanceFailure[];
  integrity_hash: string;
}>;

export type SpecificationGovernanceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "REGISTRATION" | "APPROVAL" | "AMENDMENT" | "OWNERSHIP_CHANGE" | "LIFECYCLE_TRANSITION" | "SUPERSESSION" | "RETIREMENT" | "ARCHIVAL" | "REPLAY_VALIDATION" | "CERTIFICATION_REFERENCE";
  specification_id: string;
  event_ref: string;
  evidence_refs: readonly string[];
  sequence: number;
  append_only: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type SpecificationReplayValidation = Readonly<{
  replay_validation_id: string;
  lifecycle_reproduced: boolean;
  ownership_reproduced: boolean;
  version_lineage_reproduced: boolean;
  supersession_reproduced: boolean;
  ledger_reproduced: boolean;
  certification_reproduced: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type SpecificationGovernanceCertification = Readonly<{
  certification_id: string;
  outcome: SpecificationCertificationOutcome;
  certified: boolean;
  lifecycle_deterministic: boolean;
  ownership_unique: boolean;
  governance_approval_enforced: boolean;
  immutable_versioning: boolean;
  supersession_traceable: boolean;
  replay_reproducible: boolean;
  audit_complete: boolean;
  integrity_verified: boolean;
  lineage_preserved: boolean;
  failures: readonly SpecificationGovernanceFailure[];
  integrity_hash: string;
}>;

export type SpecificationGovernanceFrameworkResult = Readonly<{
  phase_version: "specification-governance-framework/v13.8";
  phase_identifier: "SpecificationGovernanceFramework";
  artifact: SpecificationArtifact;
  registry: SpecificationRegistry;
  lifecycle_contract: SpecificationLifecycleContract;
  version_governance: VersionGovernanceRecord;
  ownership: SpecificationOwnershipRecord;
  approval_workflow: SpecificationChangeApproval;
  supersession: SpecificationSupersessionRecord;
  integrity_validation: SpecificationIntegrityValidation;
  governance_ledger: readonly SpecificationGovernanceLedgerEntry[];
  replay_validation: SpecificationReplayValidation;
  certification: SpecificationGovernanceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SpecificationGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: SpecificationCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  registry_valid: boolean;
  ledger_valid: boolean;
  replay_valid: boolean;
  failures: readonly SpecificationGovernanceFailure[];
  integrity_hash: string;
}>;

export type SpecificationGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "specification-governance-framework/v13.8";
    lifecycle_states: readonly SpecificationLifecycleState[];
    immutable_specifications_required: true;
    unique_ownership_required: true;
    governance_approval_required: true;
    historical_preservation_required: true;
    deterministic_lifecycle_required: true;
    immutable_audit_required: true;
    complete_lineage_required: true;
  }>;
  result: SpecificationGovernanceFrameworkResult;
  validation: SpecificationGovernanceValidation;
}>;
