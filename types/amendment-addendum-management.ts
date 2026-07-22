export type SpecificationChangeType = "AMENDMENT" | "ADDENDUM" | "RECONCILIATION_AMENDMENT";
export type SpecificationCompatibilityOutcome = "COMPATIBLE" | "CONDITIONALLY_COMPATIBLE" | "INCOMPATIBLE";
export type SpecificationChangeStatus = "PROPOSED" | "VALIDATED" | "APPROVED" | "REGISTERED" | "PUBLISHED" | "REJECTED";
export type SpecificationConflictType = "SEMANTIC_CONFLICT" | "TERMINOLOGY_CONFLICT" | "LIFECYCLE_CONFLICT" | "DEPENDENCY_CONFLICT" | "AUTHORITY_CONFLICT" | "GOVERNANCE_CONFLICT" | "COMPATIBILITY_CONFLICT" | "REPLAY_CONFLICT";

export type AmendmentAddendumFailure =
  | "CHANGE_ID_NOT_UNIQUE"
  | "CHANGE_SCOPE_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "AMENDMENT_REGISTRY_MUTABLE"
  | "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR"
  | "PROCESSING_STAGE_SKIPPED"
  | "CONFLICT_UNRESOLVED"
  | "COMPATIBILITY_INCOMPATIBLE"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_PRESERVATION_FAILED"
  | "EVOLUTION_LEDGER_MUTABLE"
  | "HISTORICAL_SPECIFICATION_MUTATED"
  | "CERTIFICATION_REPRODUCTION_FAILED";

export type AmendmentAddendumScenario = "BASELINE" | AmendmentAddendumFailure;
export type AmendmentAddendumInput = Readonly<{ scenario?: AmendmentAddendumScenario; tenant_id?: string }>;

export type SpecificationChangeContract = Readonly<{
  change_id: string;
  change_type: SpecificationChangeType;
  specification_ref: string;
  target_version: string;
  originating_version: string;
  change_title: string;
  change_summary: string;
  change_rationale: string;
  affected_sections: readonly string[];
  affected_semantics: readonly string[];
  compatibility_classification: SpecificationCompatibilityOutcome;
  replay_impact: string;
  lineage_refs: readonly string[];
  governance_approval_ref: string;
  effective_date: string;
  supersession_refs: readonly string[];
  integrity_hash: string;
}>;

export type AmendmentRegistryRecord = Readonly<{
  amendment_id: string;
  affected_specification_ref: string;
  modified_semantic_elements: readonly string[];
  approval_status: "APPROVED" | "REJECTED";
  version_relationships: readonly string[];
  supersession_history: readonly string[];
  replay_compatible: boolean;
  governance_owner: string;
  immutable_after_approval: boolean;
  integrity_hash: string;
}>;

export type AddendumRegistryRecord = Readonly<{
  addendum_id: string;
  originating_specification_ref: string;
  introduced_capabilities: readonly string[];
  dependency_relationships: readonly string[];
  compatibility_guarantees: readonly string[];
  governance_approval_ref: string;
  lineage_refs: readonly string[];
  existing_behavior_invalidated: boolean;
  replay_reproducible_across_versions: boolean;
  integrity_hash: string;
}>;

export type SpecificationChangeController = Readonly<{
  controller_id: string;
  processing_stages: readonly string[];
  completed_stages: readonly string[];
  workflow_deterministic: boolean;
  processing_governed: boolean;
  approvals_reproducible: boolean;
  integrity_hash: string;
}>;

export type ConflictResolutionRecord = Readonly<{
  conflict_resolution_id: string;
  conflict_types: readonly SpecificationConflictType[];
  resolution_decision_ref: string;
  rationale: string;
  historical_specifications_preserved: boolean;
  fully_explainable: boolean;
  lineage_preserved: boolean;
  conflicts_resolved: boolean;
  integrity_hash: string;
}>;

export type CompatibilityValidation = Readonly<{
  compatibility_validation_id: string;
  structural_compatibility: SpecificationCompatibilityOutcome;
  semantic_compatibility: SpecificationCompatibilityOutcome;
  lifecycle_compatibility: SpecificationCompatibilityOutcome;
  dependency_compatibility: SpecificationCompatibilityOutcome;
  authority_compatibility: SpecificationCompatibilityOutcome;
  governance_compatibility: SpecificationCompatibilityOutcome;
  replay_compatibility: SpecificationCompatibilityOutcome;
  certification_compatibility: SpecificationCompatibilityOutcome;
  outcome: SpecificationCompatibilityOutcome;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ChangeLineageGraph = Readonly<{
  lineage_graph_id: string;
  originating_specification: string;
  amendment_refs: readonly string[];
  addendum_refs: readonly string[];
  reconciliation_amendment_refs: readonly string[];
  supersession_relationships: readonly string[];
  version_ancestry: readonly string[];
  governance_approvals: readonly string[];
  certification_history: readonly string[];
  immutable: boolean;
  ancestry_complete: boolean;
  historical_relationships_preserved: boolean;
  integrity_hash: string;
}>;

export type AmendmentReplayService = Readonly<{
  replay_service_id: string;
  historical_specification_available: boolean;
  version_resolution_deterministic: boolean;
  amendment_ordering_reproduced: boolean;
  addendum_applicability_reproduced: boolean;
  replay_reconstruction_deterministic: boolean;
  certification_reproducible: boolean;
  future_amendments_ignored_for_historical_replay: boolean;
  integrity_hash: string;
}>;

export type SpecificationEvolutionLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "CHANGE_REGISTRATION" | "GOVERNANCE_APPROVAL" | "COMPATIBILITY_EVALUATION" | "CONFLICT_RESOLUTION" | "REPLAY_VALIDATION" | "SUPERSESSION_EVENT" | "LINEAGE_UPDATE" | "PUBLICATION";
  change_id: string;
  evidence_refs: readonly string[];
  sequence: number;
  append_only: boolean;
  immutable: boolean;
  cryptographically_verifiable: boolean;
  tenant_isolated: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type AmendmentAddendumCertification = Readonly<{
  certification_id: string;
  outcome: "PASS" | "FAIL";
  certified: boolean;
  failures: readonly AmendmentAddendumFailure[];
  integrity_hash: string;
}>;

export type AmendmentAddendumManagementResult = Readonly<{
  phase_version: "amendment-addendum-management/v13.10";
  phase_identifier: "AmendmentAddendumManagement";
  change_contract: SpecificationChangeContract;
  amendment_registry: readonly AmendmentRegistryRecord[];
  addendum_registry: readonly AddendumRegistryRecord[];
  change_controller: SpecificationChangeController;
  conflict_resolution: ConflictResolutionRecord;
  compatibility_validation: CompatibilityValidation;
  lineage_graph: ChangeLineageGraph;
  replay_service: AmendmentReplayService;
  evolution_ledger: readonly SpecificationEvolutionLedgerEntry[];
  certification: AmendmentAddendumCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AmendmentAddendumValidation = Readonly<{
  valid: boolean;
  outcome: "PASS" | "FAIL";
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  registries_valid: boolean;
  compatibility_valid: boolean;
  lineage_valid: boolean;
  replay_valid: boolean;
  ledger_valid: boolean;
  failures: readonly AmendmentAddendumFailure[];
  integrity_hash: string;
}>;

export type AmendmentAddendumBundle = Readonly<{
  doctrine: Readonly<{
    version: "amendment-addendum-management/v13.10";
    change_types: readonly SpecificationChangeType[];
    compatibility_outcomes: readonly SpecificationCompatibilityOutcome[];
    addenda_extend_semantics: true;
    amendments_modify_semantics: true;
    reconciliation_resolves_conflicts: true;
    governance_required: true;
    lineage_preservation_required: true;
    replay_preservation_required: true;
    historical_validity_required: true;
  }>;
  result: AmendmentAddendumManagementResult;
  validation: AmendmentAddendumValidation;
}>;
