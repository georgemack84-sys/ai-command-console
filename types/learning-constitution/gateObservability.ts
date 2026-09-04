import type { GateAuditEvent, GateOutcome, GateReasonCode } from "./durableLearningGate";

/** Read-only query surface over immutable gate audit history. */
export interface GateAuditEventReader {
  listEvents(): Promise<readonly GateAuditEvent[]>;
  verifyIntegrity(): Promise<boolean>;
}

export type DurableLearningGateHealth = Readonly<{
  totalEvaluations: number;
  outcomes: Readonly<Record<GateOutcome, number>>;
  reasonCounts: Readonly<Partial<Record<GateReasonCode, number>>>;
  constitutionalVetoCount: number;
  validationFailureCount: number;
  conflictDeferralCount: number;
  authorityDenialCount: number;
  reEvaluationCount: number;
  auditIntegrity: "VERIFIED" | "UNAVAILABLE";
  currentGateVersion?: string;
  latestEvaluationAt?: string;
}>;
