import type { RecoveryRecommendationPackage, RecoveryRecommendationScenario } from "@/types/recovery-recommendation-engine";

export type RecoveryReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE" | "INVALID";
export type RecoveryReplayIntegrityStatus = "VERIFIED" | "FAILED" | "UNVERIFIED";

export type RecoveryReplayScenario =
  | RecoveryRecommendationScenario
  | "BASELINE"
  | "CONFIDENCE_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "DEPENDENCY_GRAPH_MISMATCH"
  | "GOVERNANCE_VALIDATION_MISMATCH"
  | "RANKING_MISMATCH"
  | "INTEGRITY_MISMATCH"
  | "MISSING_FAILURE_EVIDENCE"
  | "MISSING_RECOVERY_PLAN"
  | "MISSING_DEPENDENCY_GRAPH"
  | "MISSING_GOVERNANCE_EVIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "INCOMPLETE_LINEAGE"
  | "CORRUPTED_EVIDENCE"
  | "UNAUTHORIZED_RECORD_MUTATION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "INVALID_REPLAY_REQUEST"
  | "SCHEMA_VIOLATION"
  | "EXECUTION_ATTEMPT"
  | "HISTORY_REWRITE_ATTEMPT"
  | "FABRICATE_EVIDENCE_ATTEMPT"
  | "SUPPRESS_MISMATCH_ATTEMPT"
  | "APPROVAL_ATTEMPT";

export type RecoveryReplayFailure =
  | "CONFIDENCE_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "DEPENDENCY_GRAPH_MISMATCH"
  | "GOVERNANCE_VALIDATION_MISMATCH"
  | "RANKING_MISMATCH"
  | "INTEGRITY_MISMATCH"
  | "MISSING_FAILURE_EVIDENCE"
  | "MISSING_RECOVERY_PLAN"
  | "MISSING_DEPENDENCY_GRAPH"
  | "MISSING_GOVERNANCE_EVIDENCE"
  | "MISSING_REPLAY_REFERENCE"
  | "INCOMPLETE_LINEAGE"
  | "CORRUPTED_EVIDENCE"
  | "UNAUTHORIZED_RECORD_MUTATION"
  | "TENANT_BOUNDARY_VIOLATION"
  | "INVALID_REPLAY_REQUEST"
  | "SCHEMA_VIOLATION"
  | "EXECUTION_DETECTED"
  | "RECORD_MODIFICATION_DETECTED"
  | "HISTORY_REWRITE_DETECTED"
  | "EVIDENCE_FABRICATION_DETECTED"
  | "MISMATCH_SUPPRESSION_DETECTED"
  | "APPROVAL_DETECTED";

export type RecoveryReplayReconstruction = Readonly<{
  reconstruction_id: string;
  source_reference: string;
  reconstructed_hash: string;
  original_hash: string;
  matched: boolean;
  details: readonly string[];
  integrity_hash: string;
}>;

export type RecoveryReplayResultObject = Readonly<{
  replay_result_id: string;
  recovery_id: string;
  recommendation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  replay_state: RecoveryReplayState;
  reconstructed_failures: RecoveryReplayReconstruction;
  reconstructed_planning: RecoveryReplayReconstruction;
  reconstructed_dependencies: RecoveryReplayReconstruction;
  reconstructed_alternatives: RecoveryReplayReconstruction;
  reconstructed_confidence: RecoveryReplayReconstruction;
  reconstructed_recommendations: RecoveryReplayReconstruction;
  reconstructed_governance: RecoveryReplayReconstruction;
  mismatch_reasons: readonly RecoveryReplayFailure[];
  missing_evidence: readonly RecoveryReplayFailure[];
  integrity_status: RecoveryReplayIntegrityStatus;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
  source_recommendation_package: RecoveryRecommendationPackage;
  advisory_only: true;
  recovery_executed: boolean;
  records_modified: boolean;
  replay_history_rewritten: boolean;
  evidence_fabricated: boolean;
  mismatches_suppressed: boolean;
  approval_granted: boolean;
  result_hash: string;
}>;

export type RecoveryReplayInput = Readonly<{
  scenario?: RecoveryReplayScenario;
  recommendation_package?: RecoveryRecommendationPackage;
}>;

export type RecoveryReplayValidationResult = Readonly<{
  replay_result_id: string | null;
  valid: boolean;
  state_valid: boolean;
  failure_replay_valid: boolean;
  planning_replay_valid: boolean;
  dependency_replay_valid: boolean;
  alternative_replay_valid: boolean;
  confidence_replay_valid: boolean;
  recommendation_replay_valid: boolean;
  governance_replay_valid: boolean;
  evidence_complete: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RecoveryReplayFailure[];
  validation_hash: string;
}>;

export type RecoveryReplayObservabilitySurface = Readonly<{
  replay_result_id: string;
  recovery_id: string;
  recommendation_id: string;
  replay_state: RecoveryReplayState;
  mismatch_count: number;
  missing_evidence_count: number;
  integrity_status: RecoveryReplayIntegrityStatus;
  tenant_id: string;
  advisory_only: true;
  result_hash: string;
}>;

export type RecoveryReplayEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "recovery-replay-engine/v8ALT.2.6";
    principles: readonly string[];
    replay_states: readonly RecoveryReplayState[];
    advisory_only: true;
  }>;
  replay_result: RecoveryReplayResultObject;
  validation: RecoveryReplayValidationResult;
  observability: RecoveryReplayObservabilitySurface;
}>;
