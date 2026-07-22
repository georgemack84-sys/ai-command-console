import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";
import type { RecommendationRationaleGeneratorResult } from "@/types/recommendation-rationale-generator";

export type AlternativeAnalysisState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type TradeoffCategory =
  | "mission effectiveness"
  | "operational efficiency"
  | "implementation complexity"
  | "governance impact"
  | "constitutional considerations"
  | "authority implications"
  | "confidence"
  | "uncertainty"
  | "timing"
  | "resource utilization"
  | "scalability"
  | "recoverability";

export type OpportunityCostCategory =
  | "delayed mission objectives"
  | "foregone operational gains"
  | "additional governance reviews"
  | "resource consumption"
  | "reduced future flexibility"
  | "increased recovery effort";

export type AlternativeOptionRecord = Readonly<{
  option_id: string;
  candidate_id: string;
  option_summary: string;
  advantages: readonly string[];
  disadvantages: readonly string[];
  confidence_summary: string;
  risk_summary: string;
  governance_status: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type RejectedOptionRecord = Readonly<{
  option_id: string;
  rejection_reason: string;
  evidence_summary: string;
  governance_constraints: readonly string[];
  constitutional_constraints: readonly string[];
  risk_factors: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type TradeoffAnalysis = Readonly<{
  tradeoff_id: string;
  compared_options: readonly string[];
  advantages: readonly string[];
  disadvantages: readonly string[];
  tradeoff_categories: readonly TradeoffCategory[];
  tradeoff_summary: string;
  opportunity_costs: readonly string[];
  opportunity_cost_categories: readonly OpportunityCostCategory[];
  integrity_hash: string;
}>;

export type ComparativeDecisionReport = Readonly<{
  report_id: string;
  recommended_option: string;
  comparison_matrix: readonly string[];
  operator_summary: string;
  replay_ref: string;
  integrity_hash: string;
}>;

export type AlternativeDecisionAnalysis = Readonly<{
  analysis_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  recommended_option: string;
  alternative_options: readonly string[];
  rejected_options: readonly string[];
  tradeoff_summary: string;
  opportunity_cost_summary: string;
  comparative_decision_report: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AlternativeValidationResult = Readonly<{
  validation_id: string;
  analysis_id: string;
  alternatives_available: boolean;
  rejections_explained: boolean;
  tradeoffs_complete: boolean;
  opportunity_costs_documented: boolean;
  comparative_report_complete: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  failures: readonly AlternativesTradeoffFailureReason[];
  integrity_hash: string;
}>;

export type AlternativeAnalysisLedgerEntry = Readonly<{
  ledger_id: string;
  analysis_id: string;
  package_id: string;
  orchestration_id: string;
  generation_timestamp: string;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  validation_status: "VALID" | "REJECTED";
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type AlternativesTradeoffFailureReason =
  | "ALTERNATIVES_MISSING"
  | "REJECTED_OPTIONS_UNAVAILABLE"
  | "REJECTION_RATIONALE_ABSENT"
  | "TRADEOFF_SUMMARY_MISSING"
  | "OPPORTUNITY_COSTS_UNAVAILABLE"
  | "COMPARATIVE_REPORT_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "PACKAGE_BUILD_INVALID"
  | "RATIONALE_GENERATION_INVALID"
  | "TENANT_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_TRADEOFF_GENERATOR_ACCESS"
  | "REPLAY_DIVERGENCE";

export type AlternativesTradeoffGeneratorInput = Readonly<{
  package_build_result?: DecisionPackageBuilderResult;
  rationale_result?: RecommendationRationaleGeneratorResult;
  alternative_records?: readonly AlternativeOptionRecord[];
  rejected_records?: readonly RejectedOptionRecord[];
  tradeoff_analysis?: TradeoffAnalysis;
  comparative_report?: ComparativeDecisionReport;
  analysis?: AlternativeDecisionAnalysis;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type AlternativesTradeoffGeneratorResult = Readonly<{
  generator_status: "PASS" | "FAIL";
  fail_closed: boolean;
  package_build_result: DecisionPackageBuilderResult;
  rationale_result: RecommendationRationaleGeneratorResult;
  analysis: AlternativeDecisionAnalysis;
  alternative_records: readonly AlternativeOptionRecord[];
  rejected_records: readonly RejectedOptionRecord[];
  tradeoff_analysis: TradeoffAnalysis;
  comparative_report: ComparativeDecisionReport;
  validation: AlternativeValidationResult;
  analysis_ledger: readonly AlternativeAnalysisLedgerEntry[];
  replay_hash: string;
  failures: readonly AlternativesTradeoffFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type AlternativesTradeoffReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  analysis_id: string;
  package_id: string;
  alternative_refs: readonly string[];
  rejected_refs: readonly string[];
  report_ref: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly AlternativesTradeoffFailureReason[];
  integrity_hash: string;
}>;

export type AlternativesTradeoffObservability = Readonly<{
  alternatives_rendered: number;
  rejected_options_analyzed: number;
  tradeoff_summaries_generated: number;
  opportunity_costs_documented: number;
  comparison_completeness: number;
  analysis_generation_latency_ms: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type AlternativesTradeoffFoundation = Readonly<{
  generator_version: "alternatives-tradeoff-generator/v1";
  analysis_states: readonly AlternativeAnalysisState[];
  tradeoff_categories: readonly TradeoffCategory[];
  opportunity_cost_categories: readonly OpportunityCostCategory[];
  result: AlternativesTradeoffGeneratorResult;
  replay: AlternativesTradeoffReplay;
  observability: AlternativesTradeoffObservability;
}>;
