import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";

export type TenantIsolationDomain =
  | "TENANT_IDENTITY"
  | "PROPOSAL_OWNERSHIP"
  | "DATA"
  | "KNOWLEDGE"
  | "RECOMMENDATIONS"
  | "CONFIDENCE_MODELS"
  | "RISK_MODELS"
  | "REPLAY"
  | "EVIDENCE"
  | "TRUTH_LEDGER"
  | "AUDIT_LEDGER"
  | "GOVERNANCE"
  | "CERTIFICATION"
  | "AUTHORITY"
  | "POLICIES"
  | "CONFIGURATION"
  | "RUNTIME_STATE"
  | "METADATA"
  | "SIMULATION"
  | "OBSERVABILITY";

export type TenantIsolationCheckStatus = "ISOLATED" | "CONTAMINATED" | "UNVERIFIED" | "AMBIGUOUS";
export type TenantLeakageSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TenantIsolationStatus =
  | "ISOLATED"
  | "ISOLATED_WITH_REVIEW"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "ISOLATION_CONFLICT"
  | "RESTRICTED"
  | "REJECTED"
  | "FAIL_CLOSED";

export type TenantIsolationFailure =
  | "TENANT_IDENTITY_UNVERIFIED"
  | "PROPOSAL_OWNERSHIP_AMBIGUOUS"
  | "TENANT_LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_DATA_ACCESS"
  | "CROSS_TENANT_RECOMMENDATION_INFLUENCE"
  | "REPLAY_BOUNDARY_VIOLATED"
  | "EVIDENCE_OWNERSHIP_UNVERIFIED"
  | "LEDGER_ISOLATION_COMPROMISED"
  | "GOVERNANCE_ISOLATION_FAILED"
  | "CERTIFICATION_ISOLATION_FAILED"
  | "CROSS_TENANT_LEARNING_DETECTED"
  | "CROSS_TENANT_OPTIMIZATION_DETECTED"
  | "NAMESPACE_INTEGRITY_VIOLATED"
  | "HIDDEN_TENANT_DEPENDENCY"
  | "SHARED_PROPOSAL_INFLUENCE"
  | "SHARED_CONFIDENCE_ADAPTATION"
  | "SHARED_GOVERNANCE_OUTCOME"
  | "SHARED_REPLAY_HISTORY"
  | "SHARED_EVIDENCE_USAGE"
  | "SHARED_CERTIFICATION_INHERITANCE"
  | "CROSS_TENANT_AUTHORITY_PROPAGATION"
  | "CROSS_TENANT_POLICY_EVALUATION"
  | "FOREIGN_TENANT_REFERENCE"
  | "MIXED_TENANT_OWNERSHIP"
  | "METADATA_LEAKAGE"
  | "NONDETERMINISTIC_ISOLATION_REASONING"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "ISOLATION_DECISION_RECORDING_FAILED";

export type TenantIsolationScenario =
  | RiskAdaptationScenario
  | "BASELINE"
  | "REVIEW_REQUIRED"
  | "ISOLATION_CONFLICT"
  | "RESTRICTED_PROPOSAL"
  | "TENANT_IDENTITY_FAILURE"
  | "OWNERSHIP_AMBIGUOUS"
  | "LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_DATA"
  | "CROSS_TENANT_RECOMMENDATION"
  | "REPLAY_BOUNDARY"
  | "EVIDENCE_UNVERIFIED"
  | "LEDGER_COMPROMISED"
  | "GOVERNANCE_CONTAMINATION"
  | "CERTIFICATION_CONTAMINATION"
  | "CROSS_TENANT_LEARNING"
  | "CROSS_TENANT_OPTIMIZATION"
  | "NAMESPACE_VIOLATION"
  | "HIDDEN_TENANT_DEPENDENCY"
  | "SHARED_PROPOSAL"
  | "SHARED_CONFIDENCE"
  | "SHARED_GOVERNANCE"
  | "SHARED_REPLAY"
  | "SHARED_EVIDENCE"
  | "SHARED_CERTIFICATION"
  | "AUTHORITY_PROPAGATION"
  | "CROSS_TENANT_AUTHORITY"
  | "POLICY_EVALUATION"
  | "FOREIGN_REFERENCE"
  | "MIXED_OWNERSHIP"
  | "METADATA_LEAKAGE"
  | "NONDETERMINISTIC"
  | "REPLAY_DIVERGENCE"
  | "HASH_MISMATCH"
  | "LEDGER_FAILURE"
  | "MISSING_EVIDENCE";

export type TenantIsolationAssessment = Readonly<{
  assessment_id: string;
  domain: TenantIsolationDomain;
  status: TenantIsolationCheckStatus;
  tenant_id: string;
  foreign_tenant_refs: readonly string[];
  reasoning: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type TenantLeakageFinding = Readonly<{
  leakage_id: string;
  domain: TenantIsolationDomain;
  failure: TenantIsolationFailure;
  severity: TenantLeakageSeverity;
  direct: boolean;
  root_cause: string;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type TenantLineage = Readonly<{
  lineage_id: string;
  origin_tenant_id: string;
  proposal_owner: string;
  lineage_refs: readonly string[];
  complete: boolean;
  namespace_verified: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  validation_id: string;
  proposal_id: string;
  tenant_id: string;
  final_status: TenantIsolationStatus;
  append_only: true;
  immutable: true;
  replayable: true;
  tenant_isolated: boolean;
  recorded_at: string;
  integrity_hash: string;
}>;

export type TenantIsolationEvidenceReport = Readonly<{
  report_id: string;
  isolation_result: "PASS" | "FAIL" | "VIOLATION" | "UNKNOWN";
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type TenantIsolationEvaluation = Readonly<{
  evaluation_id: string;
  isolation_domain: TenantIsolationDomain;
  isolation_result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type TenantIsolationLegacyLedgerRecord = Readonly<{
  ledger_id: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type TenantIsolationValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  proposal_id: string;
  ownership_status: TenantIsolationCheckStatus;
  data_isolation_status: TenantIsolationCheckStatus;
  recommendation_isolation_status: TenantIsolationCheckStatus;
  replay_isolation_status: TenantIsolationCheckStatus;
  evidence_isolation_status: TenantIsolationCheckStatus;
  ledger_isolation_status: TenantIsolationCheckStatus;
  governance_isolation_status: TenantIsolationCheckStatus;
  certification_isolation_status: TenantIsolationCheckStatus;
  isolation_assessments: readonly TenantIsolationAssessment[];
  detected_leakage: readonly TenantLeakageFinding[];
  isolation_dependencies: readonly string[];
  tenant_lineage: TenantLineage;
  isolation_status: TenantIsolationStatus;
  isolation_reasoning: readonly string[];
  failures: readonly TenantIsolationFailure[];
  supporting_evidence: readonly string[];
  replay_reference: string;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type TenantIsolationApiSurface = Readonly<{
  api_id: string;
  validate_proposal: "POST /tenant-isolation-validator/validate";
  retrieve_ownership: "POST /tenant-isolation-validator/ownership";
  retrieve_data: "POST /tenant-isolation-validator/data";
  retrieve_recommendations: "POST /tenant-isolation-validator/recommendations";
  retrieve_replay: "POST /tenant-isolation-validator/replay-isolation";
  retrieve_evidence: "POST /tenant-isolation-validator/evidence";
  retrieve_ledgers: "POST /tenant-isolation-validator/ledgers";
  retrieve_governance: "POST /tenant-isolation-validator/governance";
  retrieve_certification: "POST /tenant-isolation-validator/certification";
  retrieve_leakage: "POST /tenant-isolation-validator/leakage";
  retrieve_ledger: "POST /tenant-isolation-validator/ledger";
  replay_validation: "POST /tenant-isolation-validator/replay";
  retrieve_contract: "GET /tenant-isolation-validator/contract";
  cross_tenant_learning_supported: false;
  cross_tenant_optimization_supported: false;
  shared_evidence_supported: false;
  shared_replay_supported: false;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type TenantIsolationValidatorInput = Readonly<{
  scenario?: TenantIsolationScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: unknown;
  authority_result?: unknown;
  governance_decision?: unknown;
  governance_policy_result?: unknown;
}>;

export type TenantIsolationValidatorResult = Readonly<{
  tenant_isolation_validator_version: "tenant-isolation-validator/v1";
  api_surface: TenantIsolationApiSurface;
  validation: TenantIsolationValidation;
  ledger_entry: TenantIsolationLedgerEntry;
  tenant_isolation_status: "PASS" | "FAIL" | "VIOLATION" | "UNKNOWN";
  evidence_report: TenantIsolationEvidenceReport;
  evaluations: readonly TenantIsolationEvaluation[];
  ledger_records: readonly TenantIsolationLegacyLedgerRecord[];
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: boolean;
  advisory_only: true;
  tenant_first: true;
  privacy_preserving: true;
  least_access_enforced: true;
  zero_cross_tenant_influence: boolean;
  fail_closed: boolean;
  tenant_isolated: boolean;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TenantIsolationValidatorFoundation = Readonly<{
  tenant_isolation_validator_version: "tenant-isolation-validator/v1";
  api_surface: TenantIsolationApiSurface;
  result: TenantIsolationValidatorResult;
}>;
