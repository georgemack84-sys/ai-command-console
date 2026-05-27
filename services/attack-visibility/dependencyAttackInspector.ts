import type { DependencyAttackInspection } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectDependencyAttack(input: {
  dependencyLineageId: string;
  dependencySafe: boolean;
}): DependencyAttackInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("dependency-inspection", base),
  });
}
