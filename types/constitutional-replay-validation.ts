import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ContinuousConstitutionalValidationRepository } from "@/types/continuous-constitutional-validation";
import type { RuntimeConstitutionalMonitoringRepository } from "@/types/runtime-constitutional-monitoring";
import type { ConstitutionalViolationDetectionRepository } from "@/types/constitutional-violation-detection";
import type { ConstitutionalResilienceAssessmentRepository } from "@/types/constitutional-resilience-assessment";
import type { ConstitutionalRecommendationRepository } from "@/types/constitutional-recommendation-engine";

export type ConstitutionalReplayDomain = "VALIDATION" | "MONITORING" | "VIOLATION" | "RECOMMENDATION" | "CONFIDENCE" | "ASSESSMENT" | "DASHBOARD";
export type ConstitutionalReplayStatus = "VERIFIED" | "MATCHING" | "WARNING" | "DEGRADED" | "FAILED" | "INVALID";
export type ConstitutionalReplayScenario = "BASELINE" | "REPLAY_MISMATCH" | "ORDERING_MISMATCH" | "STATE_MISMATCH" | "CONFIDENCE_MISMATCH" | "HASH_MISMATCH" | "EVIDENCE_MISMATCH" | "GOVERNANCE_MISMATCH" | "AUTHORITY_MISMATCH" | "RECOMMENDATION_MISMATCH" | "DASHBOARD_MISMATCH" | "LINEAGE_CORRUPTION" | "REPLAY_NONDETERMINISM" | "INCOMPLETE_CONSTITUTIONAL_HISTORY" | "INTEGRITY_VERIFICATION_FAILURE" | "TENANT_ISOLATION_VIOLATION" | "MISSING_REPLAY_EVIDENCE";
export type ConstitutionalReplayFailure = "REPLAY_MISMATCH_DETECTED" | "ORDERING_MISMATCH_DETECTED" | "STATE_MISMATCH_DETECTED" | "CONFIDENCE_MISMATCH_DETECTED" | "HASH_MISMATCH_DETECTED" | "EVIDENCE_MISMATCH_DETECTED" | "GOVERNANCE_MISMATCH_DETECTED" | "AUTHORITY_MISMATCH_DETECTED" | "RECOMMENDATION_MISMATCH_DETECTED" | "DASHBOARD_MISMATCH_DETECTED" | "LINEAGE_CORRUPTION_DETECTED" | "REPLAY_NONDETERMINISM_DETECTED" | "CONSTITUTIONAL_HISTORY_INCOMPLETE" | "REPLAY_INTEGRITY_VERIFICATION_FAILED" | "REPLAY_TENANT_ISOLATION_VIOLATION" | "REPLAY_EVIDENCE_MISSING";

export type ConstitutionalReplayMatrixEntry = Readonly<{
  matrix_id: string;
  component: "Validation" | "Monitoring" | "Violations" | "Recommendations" | "Confidence" | "Assessments" | "Dashboard" | "Evidence" | "Governance" | "Authority" | "Integrity" | "Lineage";
  verification: "Identical" | "Mismatch" | "Unavailable";
  original_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalReplayMismatchRecord = Readonly<{
  mismatch_id: string;
  mismatch_type: ConstitutionalReplayFailure;
  domain: ConstitutionalReplayDomain | "EVIDENCE" | "GOVERNANCE" | "AUTHORITY" | "INTEGRITY" | "LINEAGE" | "ORDERING" | "STATE";
  original_reference: string;
  replay_reference: string;
  severity: "WARNING" | "DEGRADED" | "FAILED" | "INVALID";
  explanation: string;
  evidence_reference: string;
  replay_reference_id: string;
  integrity_hash: string;
}>;

export type ConstitutionalReplayValidationReport = Readonly<{
  replay_validation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  replay_timestamp: "1970-01-01T00:00:00.000Z";
  validation_replay_status: ConstitutionalReplayStatus;
  monitor_replay_status: ConstitutionalReplayStatus;
  violation_replay_status: ConstitutionalReplayStatus;
  recommendation_replay_status: ConstitutionalReplayStatus;
  confidence_replay_status: ConstitutionalReplayStatus;
  assessment_replay_status: ConstitutionalReplayStatus;
  dashboard_replay_status: ConstitutionalReplayStatus;
  overall_replay_status: ConstitutionalReplayStatus;
  mismatch_count: number;
  confidence_score: number;
  integrity_status: "VERIFIED" | "FAILED";
  lineage_status: "COMPLETE" | "CORRUPTED" | "MISSING";
  evidence_reference: string;
  replay_reference: string;
  replay_only: true;
  historical_mutation_authorized: false;
  evidence_regeneration_authorized: false;
  execution_influence_authorized: false;
  governance_change_authorized: false;
  authority_change_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalReplayEvidencePackage = Readonly<{
  evidence_package_id: string;
  replay_validation_id: string;
  replay_summary: string;
  original_execution_reference: string;
  replay_execution_reference: string;
  constitutional_rules_evaluated: readonly string[];
  comparison_results: readonly string[];
  evidence_chain: readonly string[];
  governance_references: readonly string[];
  authority_references: readonly string[];
  confidence_calculations: readonly string[];
  integrity_verification: "VERIFIED" | "FAILED";
  replay_timeline: readonly string[];
  forensic_analysis: readonly string[];
  immutable: true;
  integrity_hash: string;
}>;

export type ConstitutionalReplayLedgerRecord = Readonly<{
  replay_record_id: string;
  replay_validation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  overall_status: ConstitutionalReplayStatus;
  mismatch_count: number;
  confidence: number;
  integrity_status: "VERIFIED" | "FAILED";
  constitutional_reference: string;
  evidence_reference: string;
  lineage_reference: string;
  certification_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalReplayValidationRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  validation_repository_id: string;
  runtime_monitoring_repository_id: string;
  violation_detection_repository_id: string;
  resilience_assessment_repository_id: string;
  recommendation_repository_id: string;
  final_state: "CONSTITUTIONAL_REPLAY_VALIDATION_COMPLETE" | "CONSTITUTIONAL_REPLAY_VALIDATION_FAIL_CLOSED";
  report: ConstitutionalReplayValidationReport;
  matrix: readonly ConstitutionalReplayMatrixEntry[];
  mismatches: readonly ConstitutionalReplayMismatchRecord[];
  evidence_packages: readonly ConstitutionalReplayEvidencePackage[];
  ledger: readonly ConstitutionalReplayLedgerRecord[];
  failures: readonly ConstitutionalReplayFailure[];
  replay_only: true;
  historical_mutation_authorized: false;
  evidence_regeneration_authorized: false;
  execution_influence_authorized: false;
  governance_change_authorized: false;
  authority_change_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalReplayValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  validation_replay_identical: boolean;
  monitoring_replay_identical: boolean;
  violation_replay_identical: boolean;
  recommendation_replay_identical: boolean;
  confidence_replay_identical: boolean;
  assessment_replay_identical: boolean;
  dashboard_replay_identical: boolean;
  evidence_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  replay_only: true;
  fail_closed_ready: boolean;
  no_historical_mutation: boolean;
  failures: readonly ConstitutionalReplayFailure[];
  validation_hash: string;
}>;

export type ConstitutionalReplayObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  overall_status: ConstitutionalReplayStatus;
  mismatch_count: number;
  matrix_count: number;
  evidence_count: number;
  ledger_count: number;
  failure_count: number;
  replay_only: true;
  historical_mutation_authorized: false;
  evidence_regeneration_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalReplayValidationInput = Readonly<{ scenario?: ConstitutionalReplayScenario; baseline?: ConstitutionalBaselineContract; validationRepository?: ContinuousConstitutionalValidationRepository; runtimeRepository?: RuntimeConstitutionalMonitoringRepository; violationRepository?: ConstitutionalViolationDetectionRepository; resilienceRepository?: ConstitutionalResilienceAssessmentRepository; recommendationRepository?: ConstitutionalRecommendationRepository; repository?: ConstitutionalReplayValidationRepository }>;

export type ConstitutionalReplayValidationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-replay-validation/v8ALT.10.7";
    final_state: "CONSTITUTIONAL_REPLAY_VALIDATION_READY";
    replay_domains: readonly ConstitutionalReplayDomain[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalReplayValidationRepository;
  validation: ConstitutionalReplayValidationResult;
  observability: ConstitutionalReplayObservabilitySurface;
}>;
