export type CandidateDependencyStatus = "IDENTIFIED" | "SEARCH_IN_PROGRESS" | "SOURCE_LOCATED" | "SOURCE_NOT_FOUND" | "PROMOTED_TO_VERIFICATION" | "REJECTED";
export type DependencyStatus = "UNVERIFIED" | "VERIFICATION_IN_PROGRESS" | "VERIFIED_COMPATIBLE" | "VERIFIED_INCOMPATIBLE" | "MISSING" | "SUPERSEDED";
export type DependencyGovernanceOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type DependencyGovernanceFailure = "SCALE_VALIDATION_NOT_APPROVED" | "CANDIDATE_LIFECYCLE_NON_DETERMINISTIC" | "DISCOVERY_NORMATIVE_LEAK" | "CANDIDATE_HISTORY_MUTABLE" | "PROMOTION_NOT_REPLAYABLE" | "MANIFEST_AUTHORITY_AMBIGUOUS" | "MANIFEST_MUTABLE" | "VERIFICATION_NON_DETERMINISTIC" | "SEMANTIC_VERIFICATION_NOT_REPRODUCIBLE" | "VERSION_VERIFICATION_NOT_REPRODUCIBLE" | "CONTENT_HASH_VERIFICATION_NOT_REPRODUCIBLE" | "CONSTITUTIONAL_COMPATIBILITY_INVALID" | "VERIFIED_MANIFEST_GATE_FAILURE" | "UNVERIFIED_MANIFEST_NOT_BLOCKED" | "INFRASTRUCTURE_BLOCKED" | "DEPENDENCY_SEMANTICS_NOT_BLOCKED" | "PHASE_13_ASSUMPTION_ALLOWED" | "GOVERNANCE_LINEAGE_INCOMPLETE" | "REPLAY_NOT_REPRODUCIBLE" | "DEPENDENCY_BLOCKING_NON_DETERMINISTIC" | "CERTIFICATION_GATE_NOT_ENFORCED" | "OBSERVABILITY_UNAVAILABLE" | "NON_CONSTITUTIONAL_OPERATIONAL_WARNING";
export type DependencyGovernanceScenario = "BASELINE" | DependencyGovernanceFailure;

export type AssuranceDependencyGovernanceInput = Readonly<{ scenario?: DependencyGovernanceScenario; dependency_status?: DependencyStatus }>;

export type CandidateDependencyRecord = Readonly<{
  candidate_dependency_id: string;
  dependency_name: string;
  dependency_type: "EXTERNAL_SPECIFICATION";
  candidate_source: string;
  discovery_reason: string;
  discovery_timestamp: string;
  discovered_by: string;
  suspected_phase: "13";
  suspected_specification: string;
  candidate_status: CandidateDependencyStatus;
  search_history_refs: readonly string[];
  promotion_refs: readonly string[];
  rejection_reason: string | null;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type AssuranceSpecificationDependencyManifest = Readonly<{
  manifest_id: string;
  dependency_id: string;
  specification_name: string;
  specification_version: string;
  source_reference: string;
  content_hash: string;
  dependency_status: DependencyStatus;
  compatibility_summary: string;
  constitutional_validation: boolean;
  semantic_validation: boolean;
  version_validation: boolean;
  governance_validation: boolean;
  verification_timestamp: string;
  verifier_identity: string;
  supersedes_manifest_ref: string | null;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type DependencyPromotionRecord = Readonly<{
  promotion_id: string;
  candidate_dependency_id: string;
  manifest_id: string;
  promotion_approved: boolean;
  candidate_history_preserved: boolean;
  authority_transition_explicit: boolean;
  compatibility_claimed: false;
  replayable: boolean;
  integrity_hash: string;
}>;

export type DependencyBlockingRecord = Readonly<{
  blocking_id: string;
  dependency_id: string;
  dependency_status: DependencyStatus;
  infrastructure_permitted: boolean;
  semantic_implementation_blocked: boolean;
  phase_13_assumptions_blocked: boolean;
  discovery_artifacts_blocked_from_certification: boolean;
  certification_gate_enforced: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type DependencyGovernanceLedgerEntry = Readonly<{
  ledger_entry_id: string;
  event_type: "DISCOVERY" | "PROMOTION" | "VERIFICATION" | "COMPATIBILITY_DECISION" | "BLOCKING_DECISION" | "GOVERNANCE_APPROVAL" | "REPLAY";
  dependency_id: string;
  sequence: number;
  lineage_ref: string;
  replay_ref: string;
  immutable: boolean;
  integrity_hash: string;
}>;

export type DependencyObservabilityRecord = Readonly<{
  observability_id: string;
  candidate_backlog_monitored: boolean;
  verification_queue_monitored: boolean;
  blocking_status_monitored: boolean;
  manifest_integrity_monitored: boolean;
  dependency_drift_monitored: boolean;
  alerts_operational: boolean;
  integrity_hash: string;
}>;

export type DependencyCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: DependencyGovernanceOutcome;
  passed: boolean;
  failure_reason: DependencyGovernanceFailure | null;
  integrity_hash: string;
}>;

export type AssuranceDependencyGovernanceResult = Readonly<{
  phase_version: "assurance-dependency-governance/v14.8";
  phase_identifier: "AssuranceDependencyGovernance";
  scale_validation_ref: string;
  candidates: readonly CandidateDependencyRecord[];
  manifests: readonly AssuranceSpecificationDependencyManifest[];
  promotion: DependencyPromotionRecord;
  blocking: DependencyBlockingRecord;
  governance_ledger: readonly DependencyGovernanceLedgerEntry[];
  observability: DependencyObservabilityRecord;
  certification_tests: readonly DependencyCertificationTest[];
  failures: readonly DependencyGovernanceFailure[];
  outcome: DependencyGovernanceOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AssuranceDependencyGovernanceValidation = Readonly<{
  valid: boolean;
  outcome: DependencyGovernanceOutcome;
  candidates_valid: boolean;
  manifests_valid: boolean;
  promotion_valid: boolean;
  blocking_valid: boolean;
  ledger_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly DependencyGovernanceFailure[];
  integrity_hash: string;
}>;

export type AssuranceDependencyGovernanceBundle = Readonly<{
  doctrine: Readonly<{
    version: "assurance-dependency-governance/v14.8";
    scale_validation_phase: "scale-stress-resilience-validation/v14.7";
    candidate_statuses: readonly CandidateDependencyStatus[];
    dependency_statuses: readonly DependencyStatus[];
    certification_outcomes: readonly DependencyGovernanceOutcome[];
    phase_13_default_status: "UNVERIFIED";
  }>;
  result: AssuranceDependencyGovernanceResult;
  validation: AssuranceDependencyGovernanceValidation;
}>;
