import type { ReplayContractPackage } from "@/types/replay-contract";

export type SupervisionReplayOutcome = "VERIFIED" | "PARTIAL" | "MISMATCH" | "INVALID";
export type RuntimeReplayConfidenceLevel = "EXACT" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type SupervisionEventType = "MONITORING_OBSERVATION" | "POLICY_EVALUATION" | "CONSTITUTION_EVALUATION" | "CONFIDENCE_CALCULATION" | "BOUNDARY_ENFORCEMENT" | "SUPERVISION_DECISION" | "HEALTH_ASSESSMENT";
export type InterventionEventType = "OPERATOR_INTERVENTION" | "ROLLBACK_RECOMMENDATION" | "PAUSE_RECOMMENDATION" | "RECOVERY_RECOMMENDATION" | "ESCALATION_RECOMMENDATION" | "INTERVENTION_OUTCOME";
export type HealthCategory = "EXECUTION" | "ORCHESTRATION" | "PLANNING" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "INTEGRITY" | "REPLAY";

export type SupervisionInterventionReplayScenario =
  | "BASELINE"
  | "SUPERVISION_DIVERGENCE"
  | "POLICY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "INTERVENTION_MISMATCH"
  | "ROLLBACK_MISMATCH"
  | "PAUSE_MISMATCH"
  | "RECOVERY_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "HEALTH_MISMATCH"
  | "GOVERNANCE_INCONSISTENCY"
  | "MISSING_RUNTIME_EVIDENCE"
  | "INTEGRITY_FAILURE"
  | "LINEAGE_BREAK"
  | "TENANT_VIOLATION";

export type SupervisionInterventionReplayFailure =
  | "SUPERVISION_DIVERGENCE"
  | "POLICY_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "INTERVENTION_MISMATCH"
  | "ROLLBACK_MISMATCH"
  | "PAUSE_MISMATCH"
  | "RECOVERY_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "HEALTH_MISMATCH"
  | "GOVERNANCE_INCONSISTENCY"
  | "MISSING_RUNTIME_EVIDENCE"
  | "INTEGRITY_FAILURE"
  | "LINEAGE_BREAK"
  | "TENANT_ISOLATION_VIOLATION";

export type SupervisionReplayIdentity = Readonly<{
  supervision_replay_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  supervision_session_id: string;
  runtime_reference: string;
  policy_reference: string;
  constitution_reference: string;
  intervention_reference: string;
  health_reference: string;
  governance_reference: string;
  truth_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type SupervisionTimelineEvent = Readonly<{
  event_id: string;
  event_type: SupervisionEventType;
  sequence: number;
  timestamp: string;
  conclusion: string;
  confidence_score: number;
  evidence_refs: readonly string[];
  governance_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type InterventionTimelineEvent = Readonly<{
  event_id: string;
  event_type: InterventionEventType;
  sequence: number;
  recommendation: string;
  operator_decision: "APPROVED" | "REJECTED" | "NOT_REQUIRED";
  authority_reference: string;
  evidence_refs: readonly string[];
  confidence_score: number;
  integrity_hash: string;
}>;

export type HealthTimelineEntry = Readonly<{
  health_id: string;
  category: HealthCategory;
  health_score: number;
  trend: "STABLE" | "DEGRADING" | "IMPROVING" | "DIVERGENT";
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceReplay = Readonly<{
  governance_replay_id: string;
  policy_evaluations: readonly string[];
  constitutional_reviews: readonly string[];
  authority_validations: readonly string[];
  boundary_enforcements: readonly string[];
  compliance_evidence: readonly string[];
  governance_decision: "APPROVED" | "REJECTED" | "MISMATCH";
  governance_hash: string;
}>;

export type SupervisionReplayValidation = Readonly<{
  validation_id: string;
  supervision_replay_id: string;
  outcome: SupervisionReplayOutcome;
  failures: readonly SupervisionInterventionReplayFailure[];
  supervision_replay_valid: boolean;
  policy_replay_valid: boolean;
  constitutional_replay_valid: boolean;
  intervention_replay_valid: boolean;
  rollback_replay_valid: boolean;
  pause_replay_valid: boolean;
  recovery_replay_valid: boolean;
  health_replay_valid: boolean;
  confidence_reproducible: boolean;
  evidence_complete: boolean;
  governance_consistent: boolean;
  integrity_verified: boolean;
  lineage_preserved: boolean;
  tenant_isolated: boolean;
  speculative_history_generated: false;
  certification_ready: boolean;
  validation_hash: string;
}>;

export type SupervisionInterventionReplayPackage = Readonly<{
  package_id: string;
  engine_version: "supervision-intervention-replay/v8G.4";
  source_replay_contract: ReplayContractPackage;
  identity: SupervisionReplayIdentity;
  supervision_timeline: readonly SupervisionTimelineEvent[];
  intervention_timeline: readonly InterventionTimelineEvent[];
  health_timeline: readonly HealthTimelineEntry[];
  governance_replay: GovernanceReplay;
  validation: SupervisionReplayValidation;
  immutable: true;
  deterministic: true;
  speculative_supervision_permitted: false;
  package_hash: string;
}>;

export type SupervisionInterventionVisibilitySurface = Readonly<{
  supervision_replay_id: string;
  execution_id: string;
  outcome: SupervisionReplayOutcome;
  failure_reasons: readonly SupervisionInterventionReplayFailure[];
  supervision_events: number;
  intervention_events: number;
  health_entries: number;
  governance_decision: "APPROVED" | "REJECTED" | "MISMATCH";
  confidence_level: RuntimeReplayConfidenceLevel;
  integrity_status: "VALID" | "INVALID";
  certification_ready: boolean;
}>;

export type SupervisionInterventionReplayFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "supervision-intervention-replay/v8G.4";
    supervision_event_types: readonly SupervisionEventType[];
    intervention_event_types: readonly InterventionEventType[];
    health_categories: readonly HealthCategory[];
    outcomes: readonly SupervisionReplayOutcome[];
  }>;
  package: SupervisionInterventionReplayPackage;
  visibility: SupervisionInterventionVisibilitySurface;
}>;
