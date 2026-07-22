import type { AlternativesTradeoffGeneratorResult } from "@/types/alternatives-tradeoff-generator";
import type { DecisionPackageBuilderResult } from "@/types/decision-package-builder";
import type { RecommendationRationaleGeneratorResult } from "@/types/recommendation-rationale-generator";

export type EvidenceRiskConfidenceSummaryState = "INITIALIZED" | "GENERATING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type EvidenceRiskConfidenceSummary = Readonly<{
  summary_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  supporting_evidence_summary: string;
  conflicting_evidence_summary: string;
  evidence_quality_summary: string;
  risk_summary: string;
  confidence_summary: string;
  replay_ref: string;
  lineage_ref: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EvidenceQualityAssessment = Readonly<{
  assessment_id: string;
  package_id: string;
  evidence_sources: readonly string[];
  evidence_completeness: "COMPLETE" | "PARTIAL" | "MISSING";
  evidence_consistency: "CONSISTENT" | "INCONSISTENT" | "UNKNOWN";
  evidence_reliability: "HIGH" | "MEDIUM" | "LOW";
  evidence_recency: "CURRENT" | "STALE" | "UNKNOWN";
  evidence_quality_score: number;
  assessment_summary: string;
  integrity_hash: string;
}>;

export type RiskSummaryRecord = Readonly<{
  risk_summary_id: string;
  package_id: string;
  operational_risk: string;
  governance_risk: string;
  constitutional_risk: string;
  implementation_risk: string;
  recovery_risk: string;
  overall_risk_profile: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  integrity_hash: string;
}>;

export type ConfidenceSummaryRecord = Readonly<{
  confidence_summary_id: string;
  package_id: string;
  recommendation_confidence: string;
  evidence_confidence: string;
  forecast_confidence: string;
  uncertainty_summary: string;
  confidence_assessment: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  integrity_hash: string;
}>;

export type SummaryValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  evidence_complete: boolean;
  conflicting_evidence_documented: boolean;
  evidence_quality_complete: boolean;
  risk_complete: boolean;
  confidence_complete: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  validation_status: "VALID" | "REJECTED";
  validation_timestamp: string;
  failures: readonly EvidenceRiskConfidenceFailureReason[];
  integrity_hash: string;
}>;

export type EvidenceSummaryLedgerEntry = Readonly<{
  ledger_id: string;
  summary_id: string;
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

export type EvidenceRiskConfidenceFailureReason =
  | "SUPPORTING_EVIDENCE_MISSING"
  | "CONFLICTING_EVIDENCE_UNAVAILABLE"
  | "EVIDENCE_QUALITY_ASSESSMENT_MISSING"
  | "RISK_SUMMARY_MISSING"
  | "CONFIDENCE_SUMMARY_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "EVIDENCE_COMPLETENESS_UNVERIFIED"
  | "PACKAGE_BUILD_INVALID"
  | "RATIONALE_INVALID"
  | "ALTERNATIVES_INVALID"
  | "TENANT_MISMATCH"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_EVIDENCE_SUMMARIZER_ACCESS"
  | "REPLAY_DIVERGENCE";

export type EvidenceRiskConfidenceInput = Readonly<{
  package_build_result?: DecisionPackageBuilderResult;
  rationale_result?: RecommendationRationaleGeneratorResult;
  alternatives_result?: AlternativesTradeoffGeneratorResult;
  summary?: EvidenceRiskConfidenceSummary;
  quality_assessment?: EvidenceQualityAssessment;
  risk_record?: RiskSummaryRecord;
  confidence_record?: ConfidenceSummaryRecord;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type EvidenceRiskConfidenceResult = Readonly<{
  summarization_status: "PASS" | "FAIL";
  fail_closed: boolean;
  package_build_result: DecisionPackageBuilderResult;
  rationale_result: RecommendationRationaleGeneratorResult;
  alternatives_result: AlternativesTradeoffGeneratorResult;
  summary: EvidenceRiskConfidenceSummary;
  quality_assessment: EvidenceQualityAssessment;
  risk_record: RiskSummaryRecord;
  confidence_record: ConfidenceSummaryRecord;
  validation: SummaryValidationResult;
  evidence_ledger: readonly EvidenceSummaryLedgerEntry[];
  replay_hash: string;
  failures: readonly EvidenceRiskConfidenceFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EvidenceRiskConfidenceReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  summary_id: string;
  package_id: string;
  evidence_sources: readonly string[];
  risk_profile: string;
  confidence_assessment: string;
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly EvidenceRiskConfidenceFailureReason[];
  integrity_hash: string;
}>;

export type EvidenceRiskConfidenceObservability = Readonly<{
  evidence_summaries_generated: number;
  evidence_completeness: number;
  conflicting_evidence_coverage: number;
  evidence_quality_scores: number;
  risk_summaries_generated: number;
  confidence_summaries_generated: number;
  validation_failures: number;
  replay_reproducibility: number;
  integrity_verification_success: number;
  fail_closed_activations: number;
}>;

export type EvidenceRiskConfidenceFoundation = Readonly<{
  summarizer_version: "evidence-risk-confidence-summarization/v1";
  summary_states: readonly EvidenceRiskConfidenceSummaryState[];
  result: EvidenceRiskConfidenceResult;
  replay: EvidenceRiskConfidenceReplay;
  observability: EvidenceRiskConfidenceObservability;
}>;
