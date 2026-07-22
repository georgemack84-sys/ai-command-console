import type { AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { MaturityAnalyticsVisualizationRepository } from "@/types/maturity-analytics-visualization";

export type AssessmentReplayScenario = "BASELINE" | "REPLAY_OUTPUT_DIVERGENCE" | "MISSING_EVIDENCE" | "EVIDENCE_INTEGRITY_FAILURE" | "SCORING_VERSION_UNAVAILABLE" | "CLASSIFICATION_RULES_UNAVAILABLE" | "RECOMMENDATION_RULES_UNAVAILABLE" | "MISSING_GOVERNANCE_EVIDENCE" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "BROKEN_LINEAGE" | "HIDDEN_ASSESSMENT_LOGIC" | "TENANT_ISOLATION_VIOLATION" | "REPLAY_MODIFICATION_ATTEMPT";
export type AssessmentReplayFailure = "REPLAY_OUTPUT_DIVERGED" | "EVIDENCE_MISSING" | "EVIDENCE_INTEGRITY_FAILED" | "SCORING_VERSION_UNAVAILABLE" | "CLASSIFICATION_RULES_UNAVAILABLE" | "RECOMMENDATION_RULES_UNAVAILABLE" | "GOVERNANCE_EVIDENCE_MISSING" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "LINEAGE_BROKEN" | "HIDDEN_ASSESSMENT_LOGIC_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "REPLAY_MODIFICATION_ATTEMPTED";
export type AssessmentReplayState = "REQUESTED" | "LOADED" | "RECONSTRUCTED" | "REPLAYING" | "VALIDATING" | "MATCHED" | "DIVERGED" | "FAILED" | "CERTIFIED";

export type ReconstructedAssessmentContext = Readonly<{
  context_id: string;
  assessment_id: string;
  assessment_contract_version: "autonomy-maturity-assessment-contract/v8ALT.11.1";
  scoring_version: string;
  classification_version: string;
  recommendation_version: string;
  enabled_domain_count: number;
  evidence_count: number;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type AssessmentReplayOutput = Readonly<{
  replay_id: string;
  source_assessment_id: string;
  replay_state: AssessmentReplayState;
  original_score: number;
  replayed_score: number;
  original_maturity_level: AutonomyMaturityLevel;
  replayed_maturity_level: AutonomyMaturityLevel;
  recommendation_count: number;
  replayed_recommendation_count: number;
  evidence_reconstructed: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  integrity_verified: boolean;
  replay_reference: string;
  lineage_reference: string;
  read_only: true;
  record_modification_authorized: false;
  integrity_hash: string;
}>;

export type ReplayDivergenceFinding = Readonly<{
  finding_id: string;
  category: "SCORING" | "CLASSIFICATION" | "RECOMMENDATION" | "EVIDENCE" | "LINEAGE" | "INTEGRITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPORT";
  detected: boolean;
  description: string;
  integrity_hash: string;
}>;

export type ReplayExplanation = Readonly<{
  explanation_id: string;
  topic: "DOMAIN_SCORING" | "AGGREGATE_SCORING" | "MATURITY_CLASSIFICATION" | "READINESS" | "GAPS" | "RECOMMENDATIONS" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPLAY" | "CONFIDENCE";
  explanation: string;
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  complete: boolean;
  integrity_hash: string;
}>;

export type ReplayAuditReport = Readonly<{
  report_id: string;
  replay_id: string;
  source_assessment_id: string;
  replay_status: AssessmentReplayState;
  original_score: number;
  replayed_score: number;
  original_maturity_level: AutonomyMaturityLevel;
  replayed_maturity_level: AutonomyMaturityLevel;
  divergence_findings: readonly ReplayDivergenceFinding[];
  evidence_reconstruction_status: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  integrity_verification: "PASS" | "FAIL";
  replay_timestamp: "1970-01-01T00:00:00.000Z";
  integrity_hash: string;
}>;

export type ReplayCertificationPackage = Readonly<{
  package_id: string;
  replay_id: string;
  audit_report_id: string;
  explanation_count: number;
  divergence_count: number;
  certification_ready: boolean;
  read_only: true;
  integrity_hash: string;
}>;

export type AssessmentReplayRepository = Readonly<{
  repository_id: string;
  final_state: "ASSESSMENT_REPLAY_COMPLETE" | "ASSESSMENT_REPLAY_FAILED";
  analytics_repository: MaturityAnalyticsVisualizationRepository;
  context: ReconstructedAssessmentContext;
  replay: AssessmentReplayOutput;
  divergences: readonly ReplayDivergenceFinding[];
  explanations: readonly ReplayExplanation[];
  audit_report: ReplayAuditReport;
  certification_package: ReplayCertificationPackage;
  failures: readonly AssessmentReplayFailure[];
  read_only: true;
  record_modification_authorized: false;
  replay_mutation_authorized: false;
  integrity_hash: string;
}>;

export type AssessmentReplayValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  replay_output_matched: boolean;
  evidence_present: boolean;
  evidence_integrity_verified: boolean;
  scoring_version_available: boolean;
  classification_rules_available: boolean;
  recommendation_rules_available: boolean;
  governance_evidence_present: boolean;
  constitutional_evidence_present: boolean;
  lineage_intact: boolean;
  no_hidden_logic: boolean;
  tenant_isolated: boolean;
  read_only: true;
  failures: readonly AssessmentReplayFailure[];
  validation_hash: string;
}>;

export type AssessmentReplayObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  replay_state: AssessmentReplayState;
  divergence_count: number;
  explanation_count: number;
  evidence_count: number;
  read_only: true;
  record_modification_authorized: false;
  integrity_hash: string;
}>;

export type AssessmentReplayInput = Readonly<{ scenario?: AssessmentReplayScenario; repository?: AssessmentReplayRepository; analytics_repository?: MaturityAnalyticsVisualizationRepository }>;

export type AssessmentReplayBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "assessment-replay-explainability/v8ALT.11.10";
    final_state: "ASSESSMENT_REPLAY_EXPLAINABILITY_READY";
    principles: readonly string[];
  }>;
  repository: AssessmentReplayRepository;
  validation: AssessmentReplayValidationResult;
  observability: AssessmentReplayObservabilitySurface;
}>;
