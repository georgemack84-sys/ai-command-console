import { buildConstitutionalAttackEngine } from "@/services/constitutional-attack-engine";
import type {
  AttackLineage,
  AttackReplayLedgerEntry,
  AttackScenarioCategory,
  ConstitutionalAttackEngineInput,
} from "@/types/constitutional-attack-engine";
import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

export function buildConstitutionalAttackFixture(overrides: Partial<{
  createdAt: string;
  deterministicSeed: string;
  scenarioCategory: AttackScenarioCategory;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: AttackLineage;
  existingReplayLedger: readonly AttackReplayLedgerEntry[];
}> = {}) {
  const readinessFixture = buildCoordinationReadinessFixture({
    createdAt: overrides.createdAt,
    metadata: overrides.metadata,
  });

  const input: ConstitutionalAttackEngineInput = Object.freeze({
    attackId: `attack-${readinessFixture.input.coordinationRecord.coordinationId}`,
    scenarioCategory: overrides.scenarioCategory ?? "GOVERNANCE_BYPASS",
    deterministicSeed: overrides.deterministicSeed ?? "seed-4.8a",
    coordinationRecord: readinessFixture.input.coordinationRecord,
    routingResult: readinessFixture.input.routingResult,
    orchestrationRecord: readinessFixture.input.orchestrationRecord,
    coordinationReplay: readinessFixture.input.coordinationReplay,
    escalationResult: readinessFixture.input.escalationResult,
    overrideResult: readinessFixture.input.overrideResult,
    boundaryResult: readinessFixture.input.boundaryResult,
    readinessResult: readinessFixture.result,
    createdAt: overrides.createdAt ?? "2026-05-17T18:00:00.000Z",
    existingLineage: overrides.existingLineage,
    existingReplayLedger: overrides.existingReplayLedger,
    metadata: overrides.metadata,
  });

  return {
    readinessFixture,
    input,
    result: buildConstitutionalAttackEngine(input),
  };
}
