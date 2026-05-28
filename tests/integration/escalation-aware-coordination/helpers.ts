import { buildEscalationAwareCoordination } from "@/services/escalation-aware-coordination";
import type { EscalationLineage, EscalationReplayLedgerEntry } from "@/types/escalation-aware-coordination";
import { buildCoordinationReplayFixture } from "@/tests/integration/coordination-replay/helpers";

export function buildEscalationAwareCoordinationFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  approvalStatus: import("@/types/proposal-lifecycle-engine").ProposalApprovalStatus;
  approvalValid: boolean;
  existingLineage: EscalationLineage;
  existingReplayLedger: readonly EscalationReplayLedgerEntry[];
}> = {}) {
  const replayFixture = buildCoordinationReplayFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });
  const healthyOrchestrationRecord = Object.freeze({
    ...replayFixture.replayInput.orchestrationRecord,
    containmentState: "safe" as const,
    orchestrationState: "strict_bounded" as const,
    ceiling: "strict" as const,
    containment: Object.freeze({
      ...replayFixture.replayInput.orchestrationRecord.containment,
      inheritedState: "safe" as const,
      ceilingLevel: "strict" as const,
    }),
    state: "strict_bounded" as const,
    validation: Object.freeze({
      ...replayFixture.replayInput.orchestrationRecord.validation,
      valid: true,
      failClosed: false,
      replaySafe: true,
      governanceBound: true,
      containmentInherited: "safe" as const,
      blockedReasons: Object.freeze([]),
      errors: Object.freeze([]),
      recursiveDelegation: Object.freeze({
        ...replayFixture.replayInput.orchestrationRecord.validation.recursiveDelegation,
        recursive: false,
        evidence: Object.freeze([]),
      }),
      isolation: Object.freeze({
        ...replayFixture.replayInput.orchestrationRecord.validation.isolation,
        isolated: true,
        leakedScopes: Object.freeze([]),
      }),
    }),
    errors: Object.freeze([]),
  });
  const approval = Object.freeze({
    ...replayFixture.replayInput.approval,
    status: overrides.approvalStatus ?? replayFixture.replayInput.approval.status,
    valid: overrides.approvalValid ?? replayFixture.replayInput.approval.valid,
  });
  const healthyCoordinationReplay = Object.freeze({
    ...replayFixture.result,
    state: "reconstructed" as const,
    governance: Object.freeze({
      ...replayFixture.result.governance,
      valid: true,
    }),
    approval: Object.freeze({
      ...replayFixture.result.approval,
      valid: approval.valid,
      explicit: approval.explicit,
      status: approval.status,
    }),
    escalation: Object.freeze({
      ...replayFixture.result.escalation,
      replaySafe: true,
    }),
    orchestration: Object.freeze({
      ...replayFixture.result.orchestration,
      orchestrationState: "strict_bounded",
      containmentState: "safe",
    }),
    warnings: Object.freeze([]),
    errors: Object.freeze([]),
  });
  const input = Object.freeze({
    escalationId: `escalation-aware-${replayFixture.replayInput.coordinationRecord.coordinationId}`,
    coordinationRecord: replayFixture.replayInput.coordinationRecord,
    routingResult: replayFixture.replayInput.routingResult,
    orchestrationRecord: healthyOrchestrationRecord,
    coordinationReplay: healthyCoordinationReplay,
    approval,
    createdAt: overrides.createdAt ?? "2026-05-17T14:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    replayFixture,
    input,
    result: buildEscalationAwareCoordination(input),
  };
}
