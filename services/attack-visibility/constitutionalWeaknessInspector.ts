import type { ConstitutionalWeakness, ConstitutionalWeaknessInspection } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectConstitutionalWeaknesses(input: {
  attackId: string;
  weaknesses: readonly ConstitutionalWeakness[];
}): ConstitutionalWeaknessInspection {
  const base = Object.freeze({
    attackId: input.attackId,
    weaknessClasses: Object.freeze(input.weaknesses.map((item) => item.classification).sort((left, right) => left.localeCompare(right))),
    highestSeverity: input.weaknesses[0]?.severity ?? "INFO",
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("weakness-inspection", base),
  });
}
