import type { ReadinessAuditRecord } from "./readinessTypes";

export function buildReadinessAuditRecord(input: {
  readinessState: ReadinessAuditRecord["readinessState"];
  readinessScore: number;
  blockedReasons: string[];
  evidenceRefs: string[];
  timestamp: string;
}): ReadinessAuditRecord {
  return {
    eventType: "AUTONOMOUS_RECOVERY_READINESS_EVALUATED",
    readinessState: input.readinessState,
    readinessScore: input.readinessScore,
    advisoryOnly: true,
    liveAutonomyEnabled: false,
    blockedReasons: input.blockedReasons,
    evidenceRefs: input.evidenceRefs,
    timestamp: input.timestamp,
  };
}

export function buildConstitutionalReadinessAuditRecord(input: {
  readinessState: string;
  readinessConfidence: number;
  blockingRisks: string[];
  warnings: string[];
  requiredOperatorActions: string[];
  sourceAuditId: string;
  generatedAt: number;
}) {
  return {
    auditId: `constitutional-readiness:${input.generatedAt}`,
    sourceAuditId: input.sourceAuditId,
    readinessState: input.readinessState,
    readinessConfidence: input.readinessConfidence,
    blockingRisks: input.blockingRisks,
    warnings: input.warnings,
    requiredOperatorActions: input.requiredOperatorActions,
    advisoryOnly: true as const,
    generatedAt: input.generatedAt,
  };
}
