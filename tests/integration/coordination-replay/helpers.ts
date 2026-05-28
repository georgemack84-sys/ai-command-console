import { buildCoordinationReplay } from "@/services/coordination-replay/coordinationReplayEngine";
import type { ImmutableReplayLineageLedger } from "@/types/coordination-replay";
import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

export function buildCoordinationReplayFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  existingLedger: ImmutableReplayLineageLedger;
}> = {}) {
  const orchestrationFixture = buildBoundedOrchestrationFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });
  const approval = orchestrationFixture.constitutionalFixture.containmentFixture.missionFixture.input.proposal.approval;
  const replayInput = Object.freeze({
    replayId: `replay-${orchestrationFixture.record.coordinationId}`,
    coordinationRecord: orchestrationFixture.constitutionalFixture.record,
    routingResult: orchestrationFixture.routingResult,
    orchestrationRecord: orchestrationFixture.record,
    approval,
    createdAt: overrides.createdAt ?? "2026-05-17T13:00:00.000Z",
    existingLedger: overrides.existingLedger,
    metadata: overrides.metadata,
  });

  return {
    orchestrationFixture,
    replayInput,
    result: buildCoordinationReplay(replayInput),
  };
}
