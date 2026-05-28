import type { AdversarialScenarioRecord, ConstitutionalAttackEngineInput } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

export function registerAdversarialScenario(
  input: ConstitutionalAttackEngineInput,
): AdversarialScenarioRecord {
  const markers = Object.freeze(
    Object.keys(input.metadata ?? {})
      .sort((left, right) => left.localeCompare(right))
      .map((item) => item.toLowerCase()),
  );
  const base = Object.freeze({
    category: input.scenarioCategory,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    approvalLineageId: input.coordinationRecord.lineage.governanceLineageId,
    dependencyLineageId: input.readinessResult.lineage.lineageId,
    deterministicSeed: input.deterministicSeed,
    markers,
  });
  return Object.freeze({
    scenarioId: hashConstitutionalAttackValue("scenario-id", {
      attackId: input.attackId,
      createdAt: input.createdAt,
      category: input.scenarioCategory,
    }),
    version: "v1",
    ...base,
    scenarioHash: hashConstitutionalAttackValue("scenario", base),
  });
}
