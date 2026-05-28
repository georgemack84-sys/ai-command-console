import type { AdversarialScenarioRecord, AttackVector } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

export function generateAttackVector(input: {
  scenario: AdversarialScenarioRecord;
  deterministicSeed: string;
}): AttackVector {
  const vectorMarkers = Object.freeze([
    input.scenario.category.toLowerCase(),
    ...input.scenario.markers,
  ].sort((left, right) => left.localeCompare(right)));
  const base = Object.freeze({
    scenarioId: input.scenario.scenarioId,
    category: input.scenario.category,
    deterministicSeed: input.deterministicSeed,
    vectorMarkers,
  });
  return Object.freeze({
    vectorId: hashConstitutionalAttackValue("vector-id", base),
    ...base,
    vectorHash: hashConstitutionalAttackValue("vector", base),
  });
}
