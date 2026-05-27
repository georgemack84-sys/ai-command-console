import { buildHumanCoordinationOverride } from "@/services/human-coordination-override";
import type {
  HumanCoordinationOverrideInput,
  OverrideLineage,
  OverrideReplayLedgerEntry,
} from "@/types/human-coordination-override";
import { buildEscalationAwareCoordinationFixture } from "@/tests/integration/escalation-aware-coordination/helpers";

export function buildHumanCoordinationOverrideFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
  overrideType: HumanCoordinationOverrideInput["overrideType"];
  authenticated: boolean;
  governanceAuthorized: boolean;
  roles: readonly string[];
  existingLineage: OverrideLineage;
  existingReplayLedger: readonly OverrideReplayLedgerEntry[];
}> = {}) {
  const escalationFixture = buildEscalationAwareCoordinationFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });

  const input: HumanCoordinationOverrideInput = Object.freeze({
    overrideId: `override-${escalationFixture.input.coordinationRecord.coordinationId}`,
    overrideType: overrides.overrideType ?? "pause",
    operator: Object.freeze({
      operatorId: "operator-1",
      authenticated: overrides.authenticated ?? true,
      governanceAuthorized: overrides.governanceAuthorized ?? true,
      roles: Object.freeze([...(overrides.roles ?? ["operator", "governance-reviewer"])]),
    }),
    reason: "Operator interrupted coordination for constitutional review.",
    coordinationRecord: escalationFixture.input.coordinationRecord,
    routingResult: escalationFixture.input.routingResult,
    orchestrationRecord: escalationFixture.input.orchestrationRecord,
    coordinationReplay: escalationFixture.input.coordinationReplay,
    escalationResult: escalationFixture.result,
    createdAt: overrides.createdAt ?? "2026-05-17T15:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    escalationFixture,
    input,
    result: buildHumanCoordinationOverride(input),
  };
}
