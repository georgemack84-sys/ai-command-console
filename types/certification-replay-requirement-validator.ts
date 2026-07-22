import type { AuthorityApprovalResolverResult } from "@/types/authority-approval-requirement-resolver";
import type { ConstitutionalDecisionValidationResult } from "@/types/constitutional-decision-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type CertificationCategory =
  | "Governance Certification"
  | "Constitutional Certification"
  | "Authority Certification"
  | "Replay Certification"
  | "Integrity Certification"
  | "Tenant Isolation Certification"
  | "Decision Certification"
  | "Evidence Certification"
  | "Mission Certification"
  | "Production Readiness Certification";

export type CertificationValidationOutcome = "VERIFIED" | "PARTIAL" | "MISSING" | "INVALID";
export type CertificationStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "REVOKED" | "FAILED";
export type ReplayRequirementStatus = "AVAILABLE" | "COMPLETE" | "PARTIAL" | "MISSING" | "DIVERGED";

export type CertificationRequirement = Readonly<{
  certification_requirement_id: string;
  certification_type: CertificationCategory;
  certification_scope: string;
  decision_candidate_id: string;
  mission_id: string;
  tenant_id: string;
  required_evidence: readonly string[];
  required_replay_artifacts: readonly string[];
  required_lineage: readonly string[];
  certification_status: CertificationStatus;
  replay_status: ReplayRequirementStatus;
  replay_determinism: "DETERMINISTIC" | "NONDETERMINISTIC" | "UNKNOWN";
  certification_version: "certification-requirement/v1";
  revoked: boolean;
  effective_date: string;
  expiration_date?: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type ReplayArtifactRecord = Readonly<{
  replay_artifact_id: string;
  artifact_type: "decision_candidate" | "governance_evaluation" | "constitutional_evaluation" | "authority_evaluation" | "tenant_validation" | "evidence_reference" | "lineage_reference" | "timestamp" | "immutable_hash" | "enforcement_outcome";
  governance_decision_id: string;
  tenant_id: string;
  mission_id: string;
  replay_ref: string;
  lineage_ref: string;
  reconstruction_hash: string;
  deterministic: boolean;
  available: boolean;
  integrity_hash: string;
}>;

export type CertificationEvidencePackage = Readonly<{
  package_id: string;
  governance_decision_id: string;
  certification_requirements: readonly string[];
  certification_results: readonly CertificationValidationOutcome[];
  replay_results: readonly ReplayRequirementStatus[];
  replay_completeness: "COMPLETE" | "PARTIAL" | "MISSING";
  replay_determinism: "DETERMINISTIC" | "NONDETERMINISTIC";
  certification_lineage: readonly string[];
  validation_outcome: CertificationValidationOutcome;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type ReplayIntegrityReport = Readonly<{
  report_id: string;
  governance_decision_id: string;
  replay_artifacts: readonly string[];
  replay_references: readonly string[];
  reconstruction_status: "RECONSTRUCTED" | "PARTIAL" | "FAILED";
  determinism_status: "DETERMINISTIC" | "NONDETERMINISTIC";
  completeness_status: "COMPLETE" | "PARTIAL" | "MISSING";
  lineage_status: "COMPLETE" | "BROKEN";
  replay_validation_result: CertificationValidationOutcome;
  created_at: string;
  integrity_hash: string;
}>;

export type CertificationReplayLedgerRecord = Readonly<{
  ledger_id: string;
  governance_decision_id: string;
  certification_results: readonly CertificationValidationOutcome[];
  replay_results: readonly ReplayRequirementStatus[];
  replay_determinism: "DETERMINISTIC" | "NONDETERMINISTIC";
  replay_completeness: "COMPLETE" | "PARTIAL" | "MISSING";
  certification_lineage: readonly string[];
  validation_outcome: CertificationValidationOutcome;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  created_at: string;
  integrity_hash: string;
}>;

export type CertificationReplayFailureReason =
  | "GOVERNANCE_CONTRACT_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "MISSING_CERTIFICATION"
  | "EXPIRED_CERTIFICATION"
  | "REVOKED_CERTIFICATION"
  | "INVALID_CERTIFICATION_VERSION"
  | "DUPLICATE_CERTIFICATION_IDENTIFIER"
  | "MISSING_REPLAY_ARTIFACTS"
  | "UNRESOLVED_REPLAY_REFERENCES"
  | "INCOMPLETE_REPLAY_PACKAGE"
  | "REPLAY_DIVERGENCE"
  | "BROKEN_CERTIFICATION_LINEAGE"
  | "CERTIFICATION_SCOPE_MISMATCH"
  | "CERTIFICATION_LEDGER_FAILED"
  | "UNAUTHORIZED_CERTIFICATION_REPLAY_VALIDATOR_ACCESS";

export type CertificationReplayValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly CertificationReplayFailureReason[];
  checks: Readonly<{
    contract_valid: boolean;
    tenant_isolation_valid: boolean;
    certifications_present: boolean;
    certifications_active: boolean;
    certification_versions_valid: boolean;
    replay_available: boolean;
    replay_complete: boolean;
    replay_deterministic: boolean;
    lineage_complete: boolean;
    replay_references_resolved: boolean;
  }>;
}>;

export type CertificationReplayValidatorInput = Readonly<{
  governance_decision?: GovernanceDecisionRecord;
  governance_policy_result?: GovernancePolicyValidationResult;
  constitutional_result?: ConstitutionalDecisionValidationResult;
  authority_result?: AuthorityApprovalResolverResult;
  tenant_result?: TenantIsolationValidatorResult;
  certification_requirements?: readonly CertificationRequirement[];
  replay_artifacts?: readonly ReplayArtifactRecord[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type CertificationReplayValidatorResult = Readonly<{
  certification_replay_status: "PASS" | "FAIL";
  fail_closed: boolean;
  governance_decision: GovernanceDecisionRecord;
  tenant_result?: TenantIsolationValidatorResult;
  certification_requirements: readonly CertificationRequirement[];
  replay_artifacts: readonly ReplayArtifactRecord[];
  evidence_package: CertificationEvidencePackage;
  replay_report: ReplayIntegrityReport;
  ledger_records: readonly CertificationReplayLedgerRecord[];
  validation: CertificationReplayValidation;
  replay_hash: string;
  failures: readonly CertificationReplayFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type CertificationReplayValidationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  governance_decision_id: string;
  certification_refs: readonly string[];
  replay_artifact_refs: readonly string[];
  evidence_package_ref: string;
  replay_report_ref: string;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly CertificationReplayFailureReason[];
  integrity_hash: string;
}>;

export type CertificationReplayObservability = Readonly<{
  certification_validation_events: number;
  replay_validation_events: number;
  replay_completeness_events: number;
  replay_determinism_events: number;
  certification_lineage_events: number;
  validation_outcome_events: number;
  ledger_append_events: number;
  replay_reconstruction_events: number;
}>;

export type CertificationReplayValidatorFoundation = Readonly<{
  validator_version: "certification-replay-requirement-validator/v1";
  certification_categories: readonly CertificationCategory[];
  validation_outcomes: readonly CertificationValidationOutcome[];
  replay_statuses: readonly ReplayRequirementStatus[];
  result: CertificationReplayValidatorResult;
  replay: CertificationReplayValidationReplay;
  observability: CertificationReplayObservability;
}>;
