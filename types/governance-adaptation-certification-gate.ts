import type { AdaptivePolicyConflictDetectorResult } from "@/types/adaptive-policy-conflict-detector";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type { EscalationRestrictionEngineResult } from "@/types/escalation-restriction-engine";
import type { EvidenceCertificationValidatorResult } from "@/types/evidence-certification-validator";
import type { GovernanceAdaptationLedgerResult } from "@/types/governance-adaptation-ledger";
import type { GovernanceAdaptationValidatorResult } from "@/types/governance-adaptation-validator";
import type { GovernanceExplainabilityReplayResult, GovernanceExplainabilityReplayScenario } from "@/types/governance-explainability-replay";
import type { RiskAdaptationFoundationResult, RiskAdaptationScenario } from "@/types/risk-adaptation-engine-foundation";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";

export type GovernanceAdaptationCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type GovernanceAdaptationCertificationStatus = "PASS" | "FAIL" | "CONDITIONAL";

export type GovernanceAdaptationCertificationFailure =
  | "GOVERNANCE_BYPASS_POSSIBLE"
  | "CONSTITUTIONAL_PROTECTIONS_WEAKENED"
  | "HUMAN_AUTHORITY_REDUCED"
  | "GOVERNANCE_SUPREMACY_COMPROMISED"
  | "OPERATOR_SUPREMACY_WEAKENED"
  | "AUTHORITY_EXPANSION_PERMITTED"
  | "PRIVILEGE_ESCALATION_SUCCEEDED"
  | "CROSS_TENANT_ADAPTATION_POSSIBLE"
  | "POLICY_CONFLICT_DETECTION_INCOMPLETE"
  | "EVIDENCE_INSUFFICIENT_OR_UNVERIFIABLE"
  | "CERTIFICATION_DEPENDENCIES_UNRESOLVED"
  | "REPLAY_DIVERGENCE"
  | "AUDITABILITY_DEGRADED"
  | "ROLLBACK_UNAVAILABLE"
  | "EXPLAINABILITY_INCOMPLETE"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "LEDGER_INTEGRITY_FAILED"
  | "INTEGRITY_HASH_VERIFICATION_FAILED"
  | "DETERMINISTIC_EXECUTION_UNREPRODUCIBLE"
  | "ADVISORY_ONLY_BEHAVIOR_VIOLATED"
  | "PRODUCTION_MUTATION_POSSIBLE"
  | "DOCUMENTATION_DEFICIENCY";

export type GovernanceAdaptationCertificationScenario =
  | RiskAdaptationScenario
  | GovernanceExplainabilityReplayScenario
  | "BASELINE"
  | "CONDITIONAL_PASS"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_WEAKENED"
  | "HUMAN_AUTHORITY_REDUCED"
  | "GOVERNANCE_SUPREMACY_COMPROMISED"
  | "OPERATOR_SUPREMACY_WEAKENED"
  | "AUTHORITY_EXPANSION_PERMITTED"
  | "PRIVILEGE_ESCALATION"
  | "CROSS_TENANT_ADAPTATION"
  | "POLICY_CONFLICT_INCOMPLETE"
  | "EVIDENCE_UNVERIFIABLE"
  | "CERTIFICATION_DEPENDENCY_UNRESOLVED"
  | "REPLAY_DIVERGENCE"
  | "AUDIT_DEGRADATION"
  | "ROLLBACK_UNAVAILABLE"
  | "EXPLAINABILITY_INCOMPLETE"
  | "LINEAGE_INCOMPLETE"
  | "LEDGER_INTEGRITY_FAILURE"
  | "HASH_MISMATCH"
  | "NONDETERMINISTIC"
  | "ADVISORY_ONLY_VIOLATION"
  | "PRODUCTION_MUTATION";

export type GovernanceAdaptationCertificationTest = Readonly<{
  test_id: string;
  test_name: string;
  expected: "PASS";
  actual: GovernanceAdaptationCertificationStatus;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceAdaptationModuleCertification = Readonly<{
  module_id: string;
  module_name: string;
  status: GovernanceAdaptationCertificationStatus;
  replay_hash: string;
  integrity_hash: string;
  advisory_only: boolean;
  fail_closed_ready: boolean;
}>;

export type GovernanceAdaptationCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  certification_outcome: GovernanceAdaptationCertificationOutcome;
  failed_tests: readonly string[];
  certification_timestamp: string;
  append_only: true;
  immutable: true;
  replayable: boolean;
  integrity_hash: string;
}>;

export type GovernanceAdaptationCertification = Readonly<{
  certification_id: string;
  certification_version: "governance-aware-adaptation-certification/v1";
  tenant_scope: string;
  module_results: readonly GovernanceAdaptationModuleCertification[];
  governance_validation_status: GovernanceAdaptationCertificationStatus;
  constitutional_validation_status: GovernanceAdaptationCertificationStatus;
  authority_validation_status: GovernanceAdaptationCertificationStatus;
  tenant_isolation_status: GovernanceAdaptationCertificationStatus;
  policy_conflict_status: GovernanceAdaptationCertificationStatus;
  evidence_validation_status: GovernanceAdaptationCertificationStatus;
  certification_dependency_status: GovernanceAdaptationCertificationStatus;
  escalation_validation_status: GovernanceAdaptationCertificationStatus;
  explainability_status: GovernanceAdaptationCertificationStatus;
  replay_status: GovernanceAdaptationCertificationStatus;
  audit_status: GovernanceAdaptationCertificationStatus;
  rollback_status: GovernanceAdaptationCertificationStatus;
  determinism_status: GovernanceAdaptationCertificationStatus;
  advisory_only_status: GovernanceAdaptationCertificationStatus;
  production_safety_status: GovernanceAdaptationCertificationStatus;
  certification_outcome: GovernanceAdaptationCertificationOutcome;
  failed_tests: readonly GovernanceAdaptationCertificationFailure[];
  certification_evidence: readonly GovernanceAdaptationCertificationTest[];
  replay_reference: string;
  certification_timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationCertificationGateApiSurface = Readonly<{
  api_id: string;
  certify_layer: "POST /governance-adaptation-certification-gate/certify";
  retrieve_matrix: "POST /governance-adaptation-certification-gate/matrix";
  retrieve_modules: "POST /governance-adaptation-certification-gate/modules";
  retrieve_integrity: "POST /governance-adaptation-certification-gate/integrity";
  retrieve_ledger: "POST /governance-adaptation-certification-gate/ledger";
  replay_certification: "POST /governance-adaptation-certification-gate/replay";
  retrieve_contract: "GET /governance-adaptation-certification-gate/contract";
  recommendation_approval_supported: false;
  production_mutation_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type GovernanceAdaptationCertificationGateInput = Readonly<{
  scenario?: GovernanceAdaptationCertificationScenario;
  adaptation_result?: RiskAdaptationFoundationResult;
  governance_result?: GovernanceAdaptationValidatorResult;
  constitutional_result?: ConstitutionalAdaptationValidatorResult;
  authority_result?: AuthorityBoundaryValidatorResult;
  tenant_result?: TenantIsolationValidatorResult;
  conflict_result?: AdaptivePolicyConflictDetectorResult;
  ledger_result?: GovernanceAdaptationLedgerResult;
  evidence_result?: EvidenceCertificationValidatorResult;
  escalation_result?: EscalationRestrictionEngineResult;
  explainability_result?: GovernanceExplainabilityReplayResult;
}>;

export type GovernanceAdaptationCertificationGateResult = Readonly<{
  governance_adaptation_certification_gate_version: "governance-adaptation-certification-gate/v1";
  api_surface: GovernanceAdaptationCertificationGateApiSurface;
  certification: GovernanceAdaptationCertification;
  certification_report: readonly string[];
  governance_validation_assessment: readonly string[];
  constitutional_compliance_report: readonly string[];
  authority_boundary_assessment: readonly string[];
  tenant_isolation_certification: readonly string[];
  policy_conflict_certification: readonly string[];
  evidence_certification_report: readonly string[];
  escalation_workflow_certification: readonly string[];
  explainability_certification: readonly string[];
  replay_verification_report: readonly string[];
  governance_lineage_report: readonly string[];
  integrity_verification_report: readonly string[];
  final_certification_decision: GovernanceAdaptationCertificationOutcome;
  failures: readonly GovernanceAdaptationCertificationFailure[];
  ledger_entry: GovernanceAdaptationCertificationLedgerEntry;
  pass: boolean;
  conditional_pass: boolean;
  fail: boolean;
  advisory_only: true;
  production_safe: boolean;
  replayable: boolean;
  audit_ready: boolean;
  immutable: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceAdaptationCertificationGateFoundation = Readonly<{
  governance_adaptation_certification_gate_version: "governance-adaptation-certification-gate/v1";
  api_surface: GovernanceAdaptationCertificationGateApiSurface;
  result: GovernanceAdaptationCertificationGateResult;
}>;
