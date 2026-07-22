import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type EvidencePoisoningStatus = "PASS" | "POISONING_DETECTED" | "QUARANTINED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type EvidencePoisoningFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_POLICY_CHANGE"
  | "UNKNOWN_SOURCE_DETECTED"
  | "BROKEN_LINEAGE_DETECTED"
  | "MISSING_PROVENANCE_DETECTED"
  | "INVALID_SIGNATURE_DETECTED"
  | "TAMPERED_EVIDENCE_DETECTED"
  | "UNVERIFIABLE_ARTIFACT_DETECTED"
  | "FABRICATED_EVIDENCE_DETECTED"
  | "DUPLICATED_EVIDENCE_DETECTED"
  | "CONTRADICTORY_EVIDENCE_DETECTED"
  | "REPLAY_INCONSISTENCY_DETECTED"
  | "SOURCE_CORRUPTION_DETECTED"
  | "SYNTHETIC_DATA_INJECTION_DETECTED"
  | "LOW_QUALITY_EVIDENCE_CLUSTER"
  | "ABNORMAL_EVIDENCE_GROWTH"
  | "INCOMPLETE_EVIDENCE_LINEAGE"
  | "EVIDENCE_REPLAY_MANIPULATION"
  | "COORDINATED_EVIDENCE_ATTACK"
  | "STALE_EVIDENCE_EXPLOITATION"
  | "EVIDENCE_CONCENTRATION_ATTACK"
  | "NONDETERMINISTIC_ASSESSMENT"
  | "NONREPLAYABLE_EVIDENCE_VALIDATION"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_EVIDENCE_BEHAVIOR";

export type EvidencePoisoningScenario =
  | "BASELINE"
  | "UNAUTHORIZED_POLICY_CHANGE"
  | "UNKNOWN_SOURCE"
  | "BROKEN_LINEAGE"
  | "MISSING_PROVENANCE"
  | "INVALID_SIGNATURE"
  | "TAMPERED_EVIDENCE"
  | "UNVERIFIABLE_ARTIFACT"
  | "FABRICATED_EVIDENCE"
  | "DUPLICATED_EVIDENCE"
  | "CONTRADICTORY_EVIDENCE"
  | "REPLAY_INCONSISTENCY"
  | "SOURCE_CORRUPTION"
  | "SYNTHETIC_DATA_INJECTION"
  | "LOW_QUALITY_CLUSTER"
  | "ABNORMAL_GROWTH"
  | "INCOMPLETE_LINEAGE"
  | "REPLAY_MANIPULATION"
  | "COORDINATED_ATTACK"
  | "STALE_EVIDENCE"
  | "EVIDENCE_CONCENTRATION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_VALIDATION"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type EvidenceTrustBaseline = Readonly<{
  baseline_id: string;
  evidence_policy_version: string;
  trusted_sources: readonly string[];
  source_classifications: readonly string[];
  quality_thresholds: readonly string[];
  provenance_requirements: readonly string[];
  lineage_requirements: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type ProvenanceReport = Readonly<{
  report_id: string;
  source_identity_valid: boolean;
  origin_authenticity_valid: boolean;
  evidence_lineage_valid: boolean;
  collection_history_valid: boolean;
  chain_of_custody_valid: boolean;
  timestamp_integrity_valid: boolean;
  cryptographic_integrity_valid: boolean;
  replay_references_valid: boolean;
  lineage_validation_summary: string;
  evidence_authenticity_assessment: string;
  rejected_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceConsistencyReport = Readonly<{
  report_id: string;
  evidence_agreement_score: number;
  historical_consistency_score: number;
  source_consistency_score: number;
  timeline_consistency_score: number;
  replay_consistency_score: number;
  lineage_consistency_score: number;
  semantic_consistency_score: number;
  contradiction_analysis: string;
  historical_consistency_assessment: string;
  detected_consistency_failures: readonly EvidencePoisoningFailure[];
  integrity_hash: string;
}>;

export type SyntheticEvidenceReport = Readonly<{
  report_id: string;
  synthetic_telemetry_detected: boolean;
  generated_observations_detected: boolean;
  fabricated_documents_detected: boolean;
  injected_events_detected: boolean;
  replay_fabrication_detected: boolean;
  automated_evidence_generation_detected: boolean;
  duplicated_synthetic_artifacts_detected: boolean;
  coordinated_injection_detected: boolean;
  injection_assessment: string;
  authenticity_summary: string;
  automatic_blocks: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceQualityReport = Readonly<{
  report_id: string;
  completeness_score: number;
  freshness_score: number;
  relevance_score: number;
  diversity_score: number;
  consistency_score: number;
  traceability_score: number;
  replay_quality_score: number;
  audit_readiness_score: number;
  quality_trend_analysis: string;
  evidence_completeness_assessment: string;
  detected_quality_failures: readonly EvidencePoisoningFailure[];
  integrity_hash: string;
}>;

export type SourceReliabilityReport = Readonly<{
  report_id: string;
  historical_accuracy_score: number;
  consistency_score: number;
  authenticity_score: number;
  poisoning_history_score: number;
  trust_history_score: number;
  governance_compliance_score: number;
  evidence_acceptance_rate: number;
  replay_reliability_score: number;
  reliability_trend_analysis: string;
  trust_degradation_assessment: string;
  compromised_sources: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceHealthScoreReport = Readonly<{
  score_id: string;
  evidence_health_score: number;
  provenance_score: number;
  quality_score: number;
  consistency_score: number;
  authenticity_score: number;
  reliability_score: number;
  replay_score: number;
  lineage_completeness_score: number;
  integrity_hash: string;
}>;

export type PoisoningAssessment = Readonly<{
  assessment_id: string;
  poisoning_detected: boolean;
  poisoning_techniques: readonly EvidencePoisoningFailure[];
  affected_evidence_refs: readonly string[];
  affected_adaptations: readonly string[];
  source_analysis: string;
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  replay_impacts: readonly string[];
  supporting_evidence: readonly string[];
  containment_actions: readonly string[];
  recommended_response: DriftResponse;
  severity: DriftSeverity;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type SourceReliabilityImpact = Readonly<{
  impact_id: string;
  affected_sources: readonly string[];
  future_learning_eligibility: string;
  governance_confidence_score: number;
  source_reliability_impact: string;
  trust_recovery_requirements: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceContainmentDecision = Readonly<{
  containment_id: string;
  rejected_evidence_refs: readonly string[];
  quarantined_evidence_refs: readonly string[];
  isolated_sources: readonly string[];
  excluded_from_learning_refs: readonly string[];
  containment_actions: readonly string[];
  governance_review_required: boolean;
  forensic_evidence_preserved: true;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type EvidencePoisoningRecord = Readonly<{
  poisoning_id: string;
  tenant_id: string;
  evidence_policy_version: string;
  poisoning_type: "EVIDENCE_POISONING";
  evidence_health_score: number;
  source_reliability_score: number;
  severity: DriftSeverity;
  affected_evidence_refs: readonly string[];
  affected_sources: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  governance_impact: string;
  replay_impact: string;
  source_reliability_impact: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type EvidencePoisoningMetrics = Readonly<{
  evidence_health_score: number;
  source_reliability_score: number;
  provenance_score: number;
  quality_score: number;
  consistency_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly EvidencePoisoningFailure[];
  integrity_hash: string;
}>;

export type EvidencePoisoningApiSurface = Readonly<{
  api_id: string;
  defend_evidence_integrity: "POST /evidence-poisoning-defense/defend";
  retrieve_baseline: "POST /evidence-poisoning-defense/baseline";
  retrieve_provenance_report: "POST /evidence-poisoning-defense/provenance";
  retrieve_consistency_report: "POST /evidence-poisoning-defense/consistency";
  retrieve_synthetic_report: "POST /evidence-poisoning-defense/synthetic";
  retrieve_quality_report: "POST /evidence-poisoning-defense/quality";
  retrieve_source_reliability: "POST /evidence-poisoning-defense/source-reliability";
  retrieve_health_score: "POST /evidence-poisoning-defense/health-score";
  retrieve_poisoning_assessment: "POST /evidence-poisoning-defense/assessment";
  retrieve_source_impact: "POST /evidence-poisoning-defense/source-impact";
  retrieve_containment: "POST /evidence-poisoning-defense/containment";
  retrieve_ledger_record: "POST /evidence-poisoning-defense/ledger";
  retrieve_metrics: "POST /evidence-poisoning-defense/metrics";
  replay_defense: "POST /evidence-poisoning-defense/replay";
  inspect_defense: "POST /evidence-poisoning-defense/inspect";
  retrieve_contract: "GET /evidence-poisoning-defense/contract";
  evidence_mutation_supported: false;
  learning_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type EvidencePoisoningInput = Readonly<{
  scenario?: EvidencePoisoningScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type EvidencePoisoningResult = Readonly<{
  evidence_poisoning_defense_version: "evidence-poisoning-defense/v1";
  defense_identifier: "EvidencePoisoningDefense";
  status: EvidencePoisoningStatus;
  api_surface: EvidencePoisoningApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: EvidenceTrustBaseline;
  provenance_report: ProvenanceReport;
  consistency_report: EvidenceConsistencyReport;
  synthetic_report: SyntheticEvidenceReport;
  quality_report: EvidenceQualityReport;
  source_reliability_report: SourceReliabilityReport;
  health_score_report: EvidenceHealthScoreReport;
  poisoning_assessment: PoisoningAssessment;
  source_reliability_impact: SourceReliabilityImpact;
  containment_decision: EvidenceContainmentDecision;
  poisoning_record: EvidencePoisoningRecord;
  metrics: EvidencePoisoningMetrics;
  failures: readonly EvidencePoisoningFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_learning: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type EvidencePoisoningFoundation = Readonly<{
  evidence_poisoning_defense_version: "evidence-poisoning-defense/v1";
  api_surface: EvidencePoisoningApiSurface;
  result: EvidencePoisoningResult;
}>;
