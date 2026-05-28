export type AutonomousRecoveryReadinessState =
  | "NOT_READY"
  | "LIMITED_READINESS"
  | "SUPERVISED_READY"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "CONSTITUTIONALLY_BLOCKED"
  | "DEGRADED"
  | "DISPUTED";

export type ReadinessDomain =
  | "GOVERNANCE"
  | "RECOVERY_INTELLIGENCE"
  | "AUDIT"
  | "SIMULATION"
  | "CONVERGENCE"
  | "ESCALATION"
  | "CONTAINMENT"
  | "ROLLBACK"
  | "CONSTITUTIONAL";

export type ReadinessValidationInput = {
  constitutionalEnforcement?: unknown;
  decisionIntelligence?: unknown;
  simulationForecast?: unknown;
  simulationLineage?: unknown;
  convergence?: unknown;
  stability?: unknown;
  escalation?: unknown;
  containment?: unknown;
  rollback?: unknown;
  auditEvidence?: unknown;
};

export type AutonomousRecoveryReadinessAssessment = {
  readinessState: AutonomousRecoveryReadinessState;
  readinessScore: number;
  governanceConfidence: number;
  simulationTrustScore: number;
  rollbackConfidence: number;
  containmentConfidence: number;
  convergenceConfidence: number;
  escalationReliability: number;
  constitutionalIntegrity: number;
  auditCompleteness: number;
  recoveryIntelligenceStability: number;
  requiresOperatorApproval: boolean;
  autonomyBlockedReasons: string[];
  advisoryOnly: true;
  liveAutonomyEnabled: false;
  evaluatedDomains: ReadinessDomain[];
  timestamp: string;
};

export type ReadinessAuditRecord = {
  eventType: "AUTONOMOUS_RECOVERY_READINESS_EVALUATED";
  readinessState: AutonomousRecoveryReadinessState;
  readinessScore: number;
  advisoryOnly: true;
  liveAutonomyEnabled: false;
  blockedReasons: string[];
  evidenceRefs: string[];
  timestamp: string;
};

export type ReadinessValidationResult = {
  valid: boolean;
  blockedReasons: string[];
  disputed: boolean;
  constitutionalBlocked: boolean;
  evidenceRefs: string[];
};
