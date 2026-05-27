import { buildCoordinationBoundaryEnforcement } from "@/services/coordination-boundary-enforcement";
import type {
  BoundaryLineage,
  BoundaryReplayLedgerEntry,
  CoordinationBoundaryInput,
} from "@/types/coordination-boundary-enforcement";
import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

export function buildCoordinationBoundaryFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: BoundaryLineage;
  existingReplayLedger: readonly BoundaryReplayLedgerEntry[];
}> = {}) {
  const overrideFixture = buildHumanCoordinationOverrideFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });

  const input: CoordinationBoundaryInput = Object.freeze({
    boundaryId: `boundary-${overrideFixture.input.coordinationRecord.coordinationId}`,
    coordinationRecord: overrideFixture.input.coordinationRecord,
    routingResult: overrideFixture.input.routingResult,
    orchestrationRecord: overrideFixture.input.orchestrationRecord,
    coordinationReplay: overrideFixture.input.coordinationReplay,
    escalationResult: overrideFixture.input.escalationResult,
    overrideResult: overrideFixture.result,
    createdAt: overrides.createdAt ?? "2026-05-17T16:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    overrideFixture,
    input,
    result: buildCoordinationBoundaryEnforcement(input),
  };
}
