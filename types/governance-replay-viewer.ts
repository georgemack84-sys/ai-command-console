export type GovernanceReplayViewerState = "REPRODUCED" | "MISMATCH" | "INVALID" | "INCOMPLETE";
export type GovernanceReplayStage =
  | "REPLAY_INITIALIZATION"
  | "INPUT_LOADING"
  | "POLICY_RECONSTRUCTION"
  | "RISK_RECONSTRUCTION"
  | "COMPLIANCE_RECONSTRUCTION"
  | "RECOMMENDATION_RECONSTRUCTION"
  | "ESCALATION_RECONSTRUCTION"
  | "OUTPUT_VERIFICATION"
  | "INTEGRITY_VERIFICATION"
  | "CERTIFICATION_VALIDATION"
  | "REPLAY_COMPLETION";
export type GovernanceReplayMismatchSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type GovernanceReplayViewerAction = "EXECUTE_REPLAY" | "MODIFY_REPLAY" | "MODIFY_EVIDENCE" | "ALTER_HISTORY" | "OVERRIDE_GOVERNANCE";

export type GovernanceReplayViewerInput = Readonly<{
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
  replay_id?: string;
  state?: GovernanceReplayViewerState;
}>;

export type GovernanceReplayArtifact = Readonly<{
  artifact_id: string;
  artifact_type: "INPUT" | "OUTPUT" | "EVIDENCE" | "POLICY" | "RISK" | "COMPLIANCE" | "RECOMMENDATION" | "ESCALATION";
  title: string;
  state: "VISIBLE" | "RECONSTRUCTED" | "VERIFIED" | "MISMATCH" | "MISSING" | "INVALID";
  hash: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  explanation: string;
}>;

export type GovernanceReplayTimelineEvent = Readonly<{
  event_id: string;
  stage: GovernanceReplayStage;
  timestamp: string;
  state: GovernanceReplayViewerState;
  checkpoint_ref: string;
  duration_ms: number;
  explanation: string;
  event_hash: string;
}>;

export type GovernanceReplayComparison = Readonly<{
  comparison_id: string;
  exact_match: boolean;
  original_hash: string;
  replay_hash: string;
  mismatches: readonly Readonly<{
    mismatch_id: string;
    severity: GovernanceReplayMismatchSeverity;
    category: "INPUT" | "POLICY" | "RISK" | "COMPLIANCE" | "RECOMMENDATION" | "ESCALATION" | "EVIDENCE" | "HASH" | "INTEGRITY";
    summary: string;
    investigation_refs: readonly string[];
  }>[];
  comparison_hash: string;
}>;

export type GovernanceReplayVerification = Readonly<{
  verification_state: GovernanceReplayViewerState;
  reconstruction_complete: boolean;
  replay_confidence: number;
  determinism_validated: boolean;
  integrity_validated: boolean;
  certification_outcome: "PASS" | "CONDITIONAL_PASS" | "FAIL";
  validation_rules: readonly string[];
  verification_hash: string;
}>;

export type GovernanceReplayViewerView = Readonly<{
  viewer_id: string;
  schema_version: "governance-replay-viewer/v7K.2";
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  replay_id: string;
  replay_state: GovernanceReplayViewerState;
  replay_version: "governance-replay-view/v7K.2";
  replay_timestamp: string;
  read_only: true;
  advisory_only: true;
  replay_execution_allowed: false;
  mutation_allowed: false;
  tenant_isolated: boolean;
  authorization_enforced: boolean;
  inputs: readonly GovernanceReplayArtifact[];
  outputs: readonly GovernanceReplayArtifact[];
  evidence: readonly GovernanceReplayArtifact[];
  policies: readonly GovernanceReplayArtifact[];
  risks: readonly GovernanceReplayArtifact[];
  compliance: readonly GovernanceReplayArtifact[];
  recommendations: readonly GovernanceReplayArtifact[];
  escalations: readonly GovernanceReplayArtifact[];
  timeline: readonly GovernanceReplayTimelineEvent[];
  hashes: Readonly<{
    replay_hash: string;
    reconstruction_hash: string;
    evidence_hash: string;
    policy_hash: string;
    integrity_chain_hash: string;
    hash_comparison: "MATCH" | "MISMATCH";
  }>;
  verification: GovernanceReplayVerification;
  comparison: GovernanceReplayComparison;
  viewer_hash: string;
}>;

export type GovernanceReplayViewerObservabilitySurface = Readonly<{
  viewer_id: string;
  replay_id: string;
  replay_state: GovernanceReplayViewerState;
  timeline_events: number;
  mismatch_count: number;
  read_only: true;
  viewer_hash: string;
}>;
