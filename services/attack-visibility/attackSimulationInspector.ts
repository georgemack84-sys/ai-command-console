import type { AttackScenarioCategory, AttackSimulationInspection, AttackSimulationState } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectAttackSimulation(input: {
  attackId: string;
  coordinationId: string;
  attackState: AttackSimulationState;
  categories: readonly AttackScenarioCategory[];
}): AttackSimulationInspection {
  const base = Object.freeze({
    attackId: input.attackId,
    coordinationId: input.coordinationId,
    attackState: input.attackState,
    categories: Object.freeze([...input.categories]),
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("attack-inspection", base),
  });
}
