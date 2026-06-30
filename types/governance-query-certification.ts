import type { GovernanceCrossLedgerCorrelationResponse } from "@/types/governance-cross-ledger-correlation";
import type { GovernanceHistoricalReconstructionResponse } from "@/types/governance-historical-reconstruction";
import type { GovernanceQueryContract, GovernanceQueryValidationResult } from "@/types/governance-query-contract";
import type { GovernanceSearchResponse } from "@/types/governance-search-engine";

export type GovernanceQueryCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceQueryCertificationCategory =
  | "QUERY_CONTRACT"
  | "SEARCH"
  | "HISTORICAL_RECONSTRUCTION"
  | "CROSS_LEDGER_CORRELATION"
  | "REPLAY"
  | "SECURITY"
  | "VISIBILITY"
  | "PERFORMANCE"
  | "INTEGRITY"
  | "EXPLAINABILITY"
  | "AUDITABILITY";

export type GovernanceQueryCertificationScenario =
  | "BASELINE"
  | "MINOR_INDEXING_IMPROVEMENT"
  | "MINOR_PERFORMANCE_OPTIMIZATION"
  | "MISSING_QUERY_CONTRACT"
  | "QUERY_SCHEMA_INVALID"
  | "POLICY_LOOKUP_MISMATCH"
  | "RECOMMENDATION_REPLAY_MISMATCH"
  | "VIOLATION_MISMATCH"
  | "ESCALATION_MISMATCH"
  | "RECONSTRUCTION_MISMATCH"
  | "CORRELATION_MISMATCH"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "LINEAGE_MISMATCH"
  | "EVIDENCE_MISMATCH"
  | "NONDETERMINISTIC_ORDERING"
  | "CROSS_TENANT_QUERY_PERMITTED"
  | "UNAUTHORIZED_QUERY_ACCEPTED"
  | "LEDGER_REFERENCE_MUTATION"
  | "REPLAY_FAILURE"
  | "HIDDEN_GOVERNANCE_RECORDS"
  | "HASH_MISMATCH"
  | "UNEXPLAINED_GOVERNANCE_RELATIONSHIP"
  | "MISSING_AUDIT_HISTORY";

export type GovernanceQueryCertificationTest = Readonly<{
  test_id: string;
  name: string;
  category: GovernanceQueryCertificationCategory;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  critical: boolean;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  message: string;
  test_hash: string;
}>;

export type GovernanceQueryCertificationCategoryResult = Readonly<{
  category: GovernanceQueryCertificationCategory;
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  category_status: GovernanceQueryCertificationStatus;
  category_hash: string;
}>;

export type QueryCertificationReport = Readonly<{
  certification_id: string;
  phase: "7J.5";
  execution_timestamp: string;
  contract_version: string;
  schema_version: "governance-query-certification/v7J.5";
  query_engine_version: "governance-query/v7J.1";
  search_engine_version: "governance-search-engine/v7J.2";
  historical_reconstruction_version: "governance-historical-reconstruction/v7J.3";
  correlation_engine_version: "governance-cross-ledger-correlation/v7J.4";
  tests_executed: number;
  tests_passed: number;
  tests_failed: number;
  replay_validation: boolean;
  lineage_validation: boolean;
  evidence_validation: boolean;
  security_validation: boolean;
  tenant_validation: boolean;
  visibility_validation: boolean;
  category_results: readonly GovernanceQueryCertificationCategoryResult[];
  overall_status: GovernanceQueryCertificationStatus;
  certification_hash: string;
  truth_ledger_record: Readonly<{
    truth_record_id: string;
    report_hash: string;
    immutable: true;
    recorded_at: string;
  }>;
}>;

export type GovernanceQueryCertificationInput = Readonly<{
  scenario?: GovernanceQueryCertificationScenario;
  query_contract?: GovernanceQueryContract;
}>;

export type GovernanceQueryCertificationResponse = Readonly<{
  phase_version: "7J.5";
  schema_version: "governance-query-certification/v7J.5";
  certification_id: string;
  status: GovernanceQueryCertificationStatus;
  downstream_governance_enabled: boolean;
  query_contract: GovernanceQueryContract | null;
  query_validation: GovernanceQueryValidationResult | null;
  search_response: GovernanceSearchResponse | null;
  historical_response: GovernanceHistoricalReconstructionResponse | null;
  correlation_response: GovernanceCrossLedgerCorrelationResponse | null;
  tests: readonly GovernanceQueryCertificationTest[];
  report: QueryCertificationReport;
  advisory_only_notice: "Query certification is deterministic, immutable, replay-verifiable, audit-backed, and gates downstream governance dependencies.";
}>;

export type GovernanceQueryCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  status: GovernanceQueryCertificationStatus;
  downstream_governance_enabled: boolean;
  tests_executed: number;
  tests_failed: number;
  critical_failures: number;
  conditional_items: number;
  certification_hash: string;
}>;
