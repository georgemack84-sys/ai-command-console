import type { OperationalStabilityAssessment } from "../../stability/operationalStabilityEngine";

export const ESCALATION_TYPES = [
  "operator",
  "governance",
  "recovery",
  "infrastructure",
  "constitutional",
  "containment",
  "emergency",
] as const;

export type EscalationType = (typeof ESCALATION_TYPES)[number];

export const ESCALATION_STATES = [
  "PENDING",
  "ACTIVE",
  "ESCALATED",
  "CONTAINED",
  "FROZEN",
  "DISPUTED",
  "BLOCKED",
  "RESOLVED",
  "VERIFIED",
  "EMERGENCY",
] as const;

export type EscalationState = (typeof ESCALATION_STATES)[number];

export const ESCALATION_SEVERITIES = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
  "CATASTROPHIC",
] as const;

export type EscalationSeverity = (typeof ESCALATION_SEVERITIES)[number];

export type EscalationCoordinationInput = {
  executionId?: string;
  source: string;
  requestedType: EscalationType;
  reason: string;
  evidence: string[];
  stabilityAssessment: OperationalStabilityAssessment;
  existingEscalations?: EscalationCoordinationState[];
  timestamp: string;
};

export type EscalationCoordinationState = {
  escalationId: string;
  escalationType: EscalationType;
  escalationState: EscalationState;
  escalationSeverity: EscalationSeverity;
  escalationSource: string;
  escalationReason: string;
  evidence: string[];
  escalationLineageId: string;
  parentEscalationId?: string;
  conflictingEscalations: string[];
  requiresContainment: boolean;
  requiresOperatorVisibility: boolean;
  frozen: boolean;
  blocked: boolean;
  blockReason?: string;
  recommendedActions: string[];
  confidence: number;
  timestamp: string;
};

export type EscalationAuditRecord = {
  auditId: string;
  escalationId: string;
  escalationLineageId: string;
  eventType: string;
  evidence: string[];
  reason: string;
  source: string;
  frozen: boolean;
  blocked: boolean;
  timestamp: string;
};

export type EscalationTelemetryEvent = {
  eventType: string;
  escalationId: string;
  escalationLineageId: string;
  timestamp: string;
};

export type EscalationCoordinationResult = {
  ok: boolean;
  state: EscalationCoordinationState;
  audit: EscalationAuditRecord;
  telemetryEvents: EscalationTelemetryEvent[];
};
