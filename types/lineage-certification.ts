import type { DecisionInfluenceAnalysis } from "@/types/decision-influence-analysis";
import type { GovernanceExplanation } from "@/types/governance-explainability";
import type { GovernanceLineageRecord } from "@/types/governance-lineage";
import type { PolicyLineageReconstruction } from "@/types/policy-lineage-reconstruction";

export type LineageCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type LineageCertificationCategory =
  | "CONTRACT"
  | "POLICY_LINEAGE"
  | "DECISION_INFLUENCE"
  | "EXPLAINABILITY"
  | "REPLAY"
  | "GOVERNANCE"
  | "TENANT_ISOLATION"
  | "INTEGRITY";

export type LineageCertificationScenario =
  | "BASELINE"
  | "MISSING_CONTRACT"
  | "IMMUTABLE_MUTATION"
  | "INCOMPLETE_LINEAGE"
  | "POLICY_REPLAY_MISMATCH"
  | "POLICY_INHERITANCE_MISMATCH"
  | "POLICY_DEPENDENCY_MISMATCH"
  | "CONSTITUTIONAL_PRECEDENCE_VIOLATION"
  | "SUPERSESSION_MISMATCH"
  | "HIDDEN_INFLUENCE"
  | "CONTRIBUTION_MISMATCH"
  | "INFLUENCE_GRAPH_MISMATCH"
  | "UNRESOLVED_CONFLICT"
  | "INCOMPLETE_EXPLANATION"
  | "EXPLANATION_REPLAY_MISMATCH"
  | "UNSUPPORTED_INFERENCE"
  | "LINEAGE_REPLAY_MISMATCH"
  | "TRUTH_LEDGER_MISMATCH"
  | "HASH_VERIFICATION_FAILED"
  | "CROSS_TENANT"
  | "GOVERNANCE_BOUNDARY_VIOLATION"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "HIDDEN_GOVERNANCE_ARTIFACT"
  | "MINOR_METADATA_GAP";

export type LineageCertificationFailureReason =
  | "GOVERNANCE_LINEAGE_INVALID"
  | "POLICY_LINEAGE_INVALID"
  | "DECISION_INFLUENCE_INVALID"
  | "EXPLAINABILITY_INVALID"
  | "REPLAY_INVALID"
  | "CONSTITUTIONAL_PRECEDENCE_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "HISTORICAL_INTEGRITY_INVALID"
  | "GOVERNANCE_BOUNDARY_INVALID"
  | "ADVISORY_ONLY_VIOLATED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "TRUTH_LEDGER_REFERENCE_INVALID"
  | "DETERMINISTIC_HASH_INVALID"
  | "UNSUPPORTED_INFERENCE_DETECTED"
  | "HIDDEN_GOVERNANCE_ARTIFACT";

export type LineageCertificationTestResult = Readonly<{
  test_id: string;
  category: LineageCertificationCategory;
  name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  failure_reason: LineageCertificationFailureReason | null;
}>;

export type LineageReplayMatrixEntry = Readonly<{
  artifact: string;
  required_result: "IDENTICAL";
  actual_result: "IDENTICAL" | "MISMATCH";
  replay_hash: string;
}>;

export type LineageCertificationEvidencePackage = Readonly<{
  governance_lineage_hash: string;
  policy_lineage_hash: string;
  decision_influence_hash: string;
  explanation_hash: string;
  replay_hashes: readonly string[];
  truth_ledger_references: readonly string[];
  evidence_references: readonly string[];
  audit_artifacts: readonly string[];
  evidence_package_hash: string;
}>;

export type LineageCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "7G.5";
  schema_version: "lineage-certification-gate/v7G.5";
  execution_timestamp: string;
  environment: "mission-control-local";
  certification_state: LineageCertificationState;
  contract_validation_results: readonly LineageCertificationTestResult[];
  policy_lineage_results: readonly LineageCertificationTestResult[];
  decision_influence_results: readonly LineageCertificationTestResult[];
  explainability_results: readonly LineageCertificationTestResult[];
  replay_results: readonly LineageCertificationTestResult[];
  governance_results: readonly LineageCertificationTestResult[];
  integrity_results: readonly LineageCertificationTestResult[];
  tenant_isolation_results: readonly LineageCertificationTestResult[];
  executed_test_results: readonly LineageCertificationTestResult[];
  failures: readonly LineageCertificationFailureReason[];
  warnings: readonly string[];
  replay_matrix: readonly LineageReplayMatrixEntry[];
  replay_hashes: readonly string[];
  truth_ledger_references: readonly string[];
  evidence_references: readonly string[];
  evidence_package: LineageCertificationEvidencePackage;
  operator_approval_status: "APPROVED_FOR_PRODUCTION" | "APPROVED_FOR_CONTROLLED_TESTING" | "BLOCKED";
  certification_signature: string;
  source_artifacts: Readonly<{
    governance_lineage: GovernanceLineageRecord;
    policy_lineage: PolicyLineageReconstruction;
    decision_influence: DecisionInfluenceAnalysis;
    explanation: GovernanceExplanation;
  }>;
  report_hash: string;
}>;

export type LineageCertificationEngineInput = Readonly<{
  scenario?: LineageCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
}>;

export type LineageCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: LineageCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  failures: readonly LineageCertificationFailureReason[];
  replay_matrix_state: "IDENTICAL" | "MISMATCH";
  operator_approval_status: LineageCertificationReport["operator_approval_status"];
  advisory_only_notice: string;
}>;
