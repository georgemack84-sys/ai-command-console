import type { AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { GovernanceAdaptationLedgerResult } from "@/types/governance-adaptation-ledger";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type EvidenceCertificationValidationState =
  | "EVIDENCE_CERTIFIED"
  | "READY_FOR_CERTIFICATION"
  | "READY_FOR_SIMULATION"
  | "DOCUMENTATION_REQUIRED"
  | "CERTIFICATION_PENDING"
  | "REQUIRES_OPERATOR_REVIEW"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type EvidenceCertificationStatus = "COMPLETE" | "SATISFIED" | "READY" | "VALIDATED" | "INCOMPLETE" | "FAILED";

export type EvidenceCertificationFailure =
  | "REQUIRED_EVIDENCE_MISSING"
  | "EVIDENCE_INTEGRITY_VERIFICATION_FAILED"
  | "EVIDENCE_QUALITY_INSUFFICIENT"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "EVIDENCE_PROVENANCE_UNVERIFIED"
  | "CERTIFICATION_DEPENDENCIES_INCOMPLETE"
  | "CERTIFICATION_CHAIN_INVALID"
  | "DOCUMENTATION_MISSING"
  | "DOCUMENTATION_INCONSISTENT"
  | "SIMULATION_PREREQUISITES_UNSATISFIED"
  | "ROLLBACK_FEASIBILITY_UNDEMONSTRATED"
  | "REPLAY_READINESS_UNVERIFIED"
  | "AUDIT_READINESS_INCOMPLETE"
  | "TRUST_VALIDATION_FAILED"
  | "NONDETERMINISTIC_VALIDATION_REASONING"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "VALIDATION_DECISION_RECORDING_FAILED"
  | "TENANT_ISOLATION_FAILED";

export type EvidenceCertificationScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "EVIDENCE_CERTIFIED"
  | "READY_FOR_CERTIFICATION"
  | "READY_FOR_SIMULATION"
  | "DOCUMENTATION_REQUIRED"
  | "CERTIFICATION_PENDING"
  | "REQUIRES_OPERATOR_REVIEW"
  | "RESTRICTED"
  | "REJECTED"
  | "MISSING_REQUIRED_EVIDENCE"
  | "EVIDENCE_INTEGRITY_FAILURE"
  | "INSUFFICIENT_EVIDENCE_QUALITY"
  | "BROKEN_EVIDENCE_LINEAGE"
  | "UNVERIFIED_PROVENANCE"
  | "INCOMPLETE_CERTIFICATION_DEPENDENCIES"
  | "INVALID_CERTIFICATION_CHAIN"
  | "MISSING_DOCUMENTATION"
  | "INCONSISTENT_DOCUMENTATION"
  | "UNMET_SIMULATION_PREREQUISITES"
  | "ROLLBACK_UNDEMONSTRATED"
  | "REPLAY_UNVERIFIED"
  | "AUDIT_INCOMPLETE"
  | "TRUST_VALIDATION_FAILURE"
  | "NONDETERMINISTIC_REASONING"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "RECORDING_FAILURE"
  | "TENANT_ISOLATION_FAILURE";

export type EvidenceArtifact = Readonly<{
  evidence_id: string;
  evidence_type: string;
  source_ref: string;
  claim_refs: readonly string[];
  quality_score: number;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type EvidenceLineageGraph = Readonly<{
  graph_id: string;
  source_origins: readonly string[];
  collection_history: readonly string[];
  transformation_history: readonly string[];
  processing_lineage: readonly string[];
  decision_lineage: readonly string[];
  replay_references: readonly string[];
  audit_references: readonly string[];
  integrity_chain: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type CertificationDependencyGraph = Readonly<{
  graph_id: string;
  governance_certification: string;
  constitutional_certification: string;
  authority_validation: string;
  tenant_isolation_validation: string;
  replay_certification: string;
  audit_readiness: string;
  trust_validation: string;
  security_validation: string;
  dependency_certifications: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type EvidenceCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  proposal_id: string;
  validation_id: string;
  validation_state: EvidenceCertificationValidationState;
  failures: readonly EvidenceCertificationFailure[];
  supporting_evidence: readonly string[];
  validation_timestamp: string;
  append_only: true;
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type EvidenceCertificationValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  evidence_completeness_status: EvidenceCertificationStatus;
  evidence_quality_score: number;
  evidence_lineage_status: EvidenceCertificationStatus;
  certification_dependency_status: EvidenceCertificationStatus;
  documentation_status: EvidenceCertificationStatus;
  simulation_prerequisite_status: EvidenceCertificationStatus;
  rollback_feasibility_status: EvidenceCertificationStatus;
  certification_readiness: EvidenceCertificationValidationState;
  validation_reasoning: readonly string[];
  supporting_evidence: readonly EvidenceArtifact[];
  dependency_graph: CertificationDependencyGraph;
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type EvidenceCertificationApiSurface = Readonly<{
  api_id: string;
  validate_evidence_certification: "POST /evidence-certification-validator/validate";
  retrieve_completeness: "POST /evidence-certification-validator/completeness";
  retrieve_quality: "POST /evidence-certification-validator/quality";
  retrieve_lineage: "POST /evidence-certification-validator/lineage";
  retrieve_dependencies: "POST /evidence-certification-validator/dependencies";
  retrieve_documentation: "POST /evidence-certification-validator/documentation";
  retrieve_simulation_readiness: "POST /evidence-certification-validator/simulation-readiness";
  retrieve_rollback: "POST /evidence-certification-validator/rollback";
  retrieve_readiness: "POST /evidence-certification-validator/readiness";
  retrieve_ledger: "POST /evidence-certification-validator/ledger";
  replay_validation: "POST /evidence-certification-validator/replay";
  retrieve_contract: "GET /evidence-certification-validator/contract";
  advisory_only: true;
  fail_open_supported: false;
  auto_implementation_supported: false;
  integrity_hash: string;
}>;

export type EvidenceCertificationValidatorInput = Readonly<{
  scenario?: EvidenceCertificationScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
  conflict_result?: AdaptivePolicyConflictDetectorResult;
  ledger_result?: GovernanceAdaptationLedgerResult;
}>;

export type EvidenceCertificationValidatorResult = Readonly<{
  evidence_certification_validator_version: "evidence-certification-validator/v1";
  api_surface: EvidenceCertificationApiSurface;
  validation: EvidenceCertificationValidation;
  evidence_completeness_report: readonly string[];
  evidence_quality_assessment: readonly string[];
  evidence_lineage_graph: EvidenceLineageGraph;
  certification_dependency_report: readonly string[];
  documentation_validation_report: readonly string[];
  simulation_readiness_assessment: readonly string[];
  rollback_feasibility_report: readonly string[];
  certification_readiness_report: readonly string[];
  failures: readonly EvidenceCertificationFailure[];
  ledger_entry: EvidenceCertificationLedgerEntry;
  validation_state: EvidenceCertificationValidationState;
  fail_closed: boolean;
  tenant_isolated: boolean;
  audit_ready: boolean;
  replayable: boolean;
  advisory_only: true;
  immutable: true;
  trust_verifiable: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type EvidenceCertificationValidatorFoundation = Readonly<{
  evidence_certification_validator_version: "evidence-certification-validator/v1";
  api_surface: EvidenceCertificationApiSurface;
  result: EvidenceCertificationValidatorResult;
}>;
