import type { ConfidenceDriftResult } from "@/types/confidence-drift-detector";

export type EvidenceSourceCategory = "AUTHORITATIVE" | "VERIFIED" | "TRUSTED" | "OPERATIONAL" | "EXTERNAL" | "DERIVED" | "UNVERIFIED" | "UNKNOWN";
export type EvidenceCompletenessRating = "COMPLETE" | "MOSTLY_COMPLETE" | "ADEQUATE" | "INCOMPLETE" | "INSUFFICIENT" | "CRITICAL_DEFICIENCY";
export type EvidenceConflictSeverity = "NONE" | "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";
export type EvidenceDurabilityRating = "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" | "VERY_LOW";
export type EvidenceReliabilityTrend = "STABLE" | "IMPROVING" | "DEGRADING" | "VOLATILE";
export type EvidenceReliabilityValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_VERIFICATION";

export type EvidenceReliabilityFailure =
  | "EVIDENCE_MISSING"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "VERIFICATION_HISTORY_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "EVIDENCE_MUTATION_DETECTED"
  | "EVIDENCE_WEIGHT_UPDATE_DETECTED"
  | "CONFIDENCE_MODEL_UPDATE_DETECTED"
  | "HISTORICAL_DECISION_CHANGE_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_ANALYSIS"
  | "FAIL_OPEN_BEHAVIOR";

export type EvidenceReliabilityScenario =
  | "BASELINE"
  | "AUTHORITATIVE"
  | "VERIFIED"
  | "TRUSTED"
  | "OPERATIONAL"
  | "EXTERNAL"
  | "DERIVED"
  | "UNVERIFIED"
  | "UNKNOWN"
  | "INCOMPLETE"
  | "STALE"
  | "CONTRADICTORY"
  | "UNCERTAIN"
  | "BROKEN_LINEAGE"
  | "MISSING_VERIFICATION"
  | "LOW_DURABILITY"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "EVIDENCE_MUTATION"
  | "WEIGHT_UPDATE"
  | "CONFIDENCE_MODEL_UPDATE"
  | "HISTORICAL_DECISION_CHANGE"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type EvidenceReliabilityRecord = Readonly<{
  evidence_reliability_id: string;
  tenant_id: string;
  mission_scope: string;
  evidence_id: string;
  source_category: EvidenceSourceCategory;
  completeness_rating: EvidenceCompletenessRating;
  conflict_severity: EvidenceConflictSeverity;
  durability_rating: EvidenceDurabilityRating;
  source_quality_score: number;
  completeness_score: number;
  freshness_score: number;
  conflict_score: number;
  uncertainty_score: number;
  lineage_integrity_score: number;
  verification_score: number;
  durability_score: number;
  overall_reliability_score: number;
  confidence_accuracy_influence: number;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  advisory_only: true;
  mutates_evidence: false;
  updates_evidence_weights: false;
  updates_confidence_model: false;
  changes_historical_decisions: false;
  integrity_hash: string;
}>;

export type SourceReliabilityProfile = Readonly<{
  profile_id: string;
  source_id: string;
  tenant_id: string;
  source_category: EvidenceSourceCategory;
  historical_accuracy: number;
  verification_success_rate: number;
  consistency_score: number;
  trust_score: number;
  durability_score: number;
  reliability_trend: EvidenceReliabilityTrend;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceReliabilityReport = Readonly<{
  report_id: string;
  reporting_period: string;
  reliability_summary: string;
  source_analysis: string;
  completeness_analysis: string;
  freshness_analysis: string;
  conflict_analysis: string;
  uncertainty_analysis: string;
  trust_assessment: string;
  governance_findings: readonly string[];
  recommended_actions: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceReliabilityRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  reliability_record_refs: readonly string[];
  source_profile_refs: readonly string[];
  report_refs: readonly string[];
  source_quality_history: Readonly<Record<EvidenceSourceCategory, readonly string[]>>;
  completeness_history: Readonly<Record<EvidenceCompletenessRating, readonly string[]>>;
  conflict_history: Readonly<Record<EvidenceConflictSeverity, readonly string[]>>;
  durability_history: Readonly<Record<EvidenceDurabilityRating, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type EvidenceReliabilityValidation = Readonly<{
  validation_id: string;
  state: EvidenceReliabilityValidationState;
  certified: boolean;
  failures: readonly EvidenceReliabilityFailure[];
  evidence_complete: boolean;
  lineage_intact: boolean;
  verification_history_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_evidence_mutation: boolean;
  no_weight_update: boolean;
  no_confidence_model_update: boolean;
  no_historical_decision_change: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type EvidenceReliabilityApiSurface = Readonly<{
  api_id: string;
  analyze_reliability: "POST /evidence-reliability-recalibrator/analyze";
  retrieve_records: "POST /evidence-reliability-recalibrator/records";
  retrieve_sources: "POST /evidence-reliability-recalibrator/sources";
  retrieve_report: "POST /evidence-reliability-recalibrator/report";
  retrieve_registry: "POST /evidence-reliability-recalibrator/registry";
  retrieve_completeness: "POST /evidence-reliability-recalibrator/completeness";
  retrieve_freshness: "POST /evidence-reliability-recalibrator/freshness";
  retrieve_conflicts: "POST /evidence-reliability-recalibrator/conflicts";
  retrieve_uncertainty: "POST /evidence-reliability-recalibrator/uncertainty";
  retrieve_lineage: "POST /evidence-reliability-recalibrator/lineage";
  retrieve_verification: "POST /evidence-reliability-recalibrator/verification";
  retrieve_durability: "POST /evidence-reliability-recalibrator/durability";
  replay_analysis: "POST /evidence-reliability-recalibrator/replay";
  retrieve_contract: "GET /evidence-reliability-recalibrator/contract";
  update_supported: false;
  delete_supported: false;
  evidence_mutation_supported: false;
  evidence_weight_update_supported: false;
  confidence_model_update_supported: false;
  historical_decision_change_supported: false;
  integrity_hash: string;
}>;

export type EvidenceReliabilityInput = Readonly<{
  scenario?: EvidenceReliabilityScenario;
  drift_result?: ConfidenceDriftResult;
}>;

export type EvidenceReliabilityResult = Readonly<{
  evidence_reliability_recalibrator_version: "evidence-reliability-recalibrator/v1";
  api_surface: EvidenceReliabilityApiSurface;
  reliability_records: readonly EvidenceReliabilityRecord[];
  source_profiles: readonly SourceReliabilityProfile[];
  report: EvidenceReliabilityReport;
  registry: EvidenceReliabilityRegistry;
  validation: EvidenceReliabilityValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_evidence: false;
  updates_evidence_weights: false;
  updates_confidence_model: false;
  changes_historical_decisions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type EvidenceReliabilityFoundation = Readonly<{
  evidence_reliability_recalibrator_version: "evidence-reliability-recalibrator/v1";
  api_surface: EvidenceReliabilityApiSurface;
  result: EvidenceReliabilityResult;
}>;
