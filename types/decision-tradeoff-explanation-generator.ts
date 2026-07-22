import type {
  ArbitrationOutcome,
  ArbitrationResult,
  ArbitrationRulesEngineResult,
} from "@/types/decision-arbitration-rules-engine";

export type TradeoffExplanationSectionName =
  | "Executive Summary"
  | "Conflict Overview"
  | "Evidence Analysis"
  | "Risk Assessment"
  | "Confidence Assessment"
  | "Governance Analysis"
  | "Constitutional Analysis"
  | "Mission Analysis"
  | "Forecast Analysis"
  | "Recovery Analysis"
  | "Final Arbitration Outcome";

export type TradeoffExplanationSection = Readonly<{
  section_name: TradeoffExplanationSectionName;
  content: string;
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type TradeoffExplanation = Readonly<{
  explanation_id: string;
  arbitration_id: string;
  conflict_id: string;
  selected_decision: string;
  rejected_decisions: readonly string[];
  tradeoff_summary: string;
  explanation_sections: readonly TradeoffExplanationSection[];
  supporting_evidence_refs: readonly string[];
  rejected_evidence_refs: readonly string[];
  risk_comparison: string;
  confidence_comparison: string;
  governance_reasoning: string;
  constitutional_reasoning: string;
  mission_impact: string;
  forecast_comparison: string;
  recovery_implications: string;
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type DecisionComparisonReport = Readonly<{
  report_id: string;
  arbitration_id: string;
  compared_decisions: readonly string[];
  evidence_analysis: string;
  risk_analysis: string;
  confidence_analysis: string;
  governance_analysis: string;
  constitutional_analysis: string;
  mission_analysis: string;
  forecast_analysis: string;
  recovery_analysis: string;
  selected_outcome: ArbitrationOutcome;
  replay_ref: string;
  integrity_hash: string;
}>;

export type TradeoffLedgerRecord = Readonly<{
  ledger_id: string;
  explanation_id: string;
  arbitration_id: string;
  arbitration_outcome: ArbitrationOutcome;
  compared_decisions: readonly string[];
  evidence_refs: readonly string[];
  tradeoffs: readonly string[];
  governance_reasoning: string;
  constitutional_reasoning: string;
  replay_ref: string;
  lineage_ref: string;
  explanation_hash: string;
  report_hash: string;
  ledger_timestamp: string;
  integrity_hash: string;
}>;

export type TradeoffExplanationFailureReason =
  | "MISSING_ARBITRATION_RECORDS"
  | "INCOMPLETE_EVIDENCE"
  | "OMITTED_REJECTED_EVIDENCE"
  | "MISSING_GOVERNANCE_REASONING"
  | "MISSING_CONSTITUTIONAL_REASONING"
  | "MISSING_MANDATORY_SECTION"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_ACCESS"
  | "CROSS_TENANT_EXPLANATION_LEAKAGE"
  | "INCOMPLETE_EXPLANATION_REPORT"
  | "ADVISORY_ONLY_VIOLATION"
  | "TRADEOFF_LEDGER_FAILED";

export type TradeoffExplanationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly TradeoffExplanationFailureReason[];
  checks: Readonly<{
    arbitration_present: boolean;
    evidence_complete: boolean;
    rejected_evidence_present: boolean;
    governance_reasoning_present: boolean;
    constitutional_reasoning_present: boolean;
    mandatory_sections_present: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
}>;

export type TradeoffExplanationGeneratorInput = Readonly<{
  arbitration_result?: ArbitrationRulesEngineResult;
  arbitrations?: readonly ArbitrationResult[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type TradeoffExplanationGeneratorResult = Readonly<{
  explanation_status: "PASS" | "FAIL";
  fail_closed: boolean;
  explanations: readonly TradeoffExplanation[];
  reports: readonly DecisionComparisonReport[];
  validations: readonly TradeoffExplanationValidation[];
  ledger_records: readonly TradeoffLedgerRecord[];
  replay_hash: string;
  failures: readonly TradeoffExplanationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type TradeoffExplanationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  explanation_refs: readonly string[];
  report_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly TradeoffExplanationFailureReason[];
  integrity_hash: string;
}>;

export type TradeoffExplanationObservability = Readonly<{
  explanations_generated: number;
  reports_generated: number;
  evidence_comparisons_completed: number;
  governance_explanations_generated: number;
  constitutional_explanations_generated: number;
  risk_comparisons: number;
  confidence_comparisons: number;
  forecast_analyses: number;
  recovery_analyses: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type TradeoffExplanationGeneratorFoundation = Readonly<{
  generator_version: "tradeoff-explanation-generator/v1";
  required_sections: readonly TradeoffExplanationSectionName[];
  result: TradeoffExplanationGeneratorResult;
  replay: TradeoffExplanationReplay;
  observability: TradeoffExplanationObservability;
}>;
