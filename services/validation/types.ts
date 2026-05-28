export type ValidationEventType =
  | "validation.started"
  | "validation.completed"
  | "validation.failed"
  | "validation.snapshot_created"
  | "validation.execution_eligibility_checked"
  | "validation.replay_completed"
  | "validation.cumulative_risk_escalated"
  | "validation.version_mismatch_detected"
  | "validation.freeze_activated"
  | "validation.containment_activated"
  | "validation.replay_corruption_detected"
  | "validation.escalation_loop_detected"
  | "validation.readiness_blocked"
  | "validation.operator_review_required"
  | "validation.constitutional_violation";

export type ValidationTelemetryMetric =
  | "governance_readiness_score"
  | "operational_stability_score"
  | "replay_integrity_confidence"
  | "rollback_survivability_score"
  | "simulation_reliability_score"
  | "containment_confidence_score"
  | "constitutional_dispute_count"
  | "recovery_conflict_rate"
  | "operator_intervention_rate"
  | "escalation_reliability_score"
  | "chaos_survivability_score"
  | "validation_failure_rate";

export type ChaosCondition =
  | "lease_loss"
  | "heartbeat_loss"
  | "replay_corruption"
  | "governance_outage"
  | "escalation_storm"
  | "dependency_instability"
  | "stale_ownership_claim"
  | "operator_interruption";

export type ValidationAuditRecord = {
  eventType: ValidationEventType;
  details: string[];
  evidenceRefs: string[];
  timestamp: string;
};

export type ValidationTelemetryPoint = {
  metric: ValidationTelemetryMetric;
  value: number;
  timestamp: string;
};

export type ValidationOutcome = {
  valid: boolean;
  freezeActivated: boolean;
  containmentActivated: boolean;
  operatorReviewRequired: boolean;
  blockedReasons: string[];
  evidenceRefs?: string[];
};

export type StewardshipValidationResult = {
  valid: boolean;
  advisoryBoundaryIntact: boolean;
  runtimeMutationDetected: boolean;
  freezeActivated: boolean;
  containmentActivated: boolean;
  operatorReviewRequired: boolean;
  replayIntegrityPreserved: boolean;
  escalationIntegrityPreserved: boolean;
  immutableLineagePreserved: boolean;
  blockedReasons: string[];
  auditRecords: ValidationAuditRecord[];
  telemetry: ValidationTelemetryPoint[];
  timestamp: string;
};
