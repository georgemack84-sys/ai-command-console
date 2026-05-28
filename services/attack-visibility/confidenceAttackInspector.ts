import type { ConfidenceAttackInspection } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectConfidenceAttack(input: {
  confidenceLinked: boolean;
  confidenceSafe: boolean;
}): ConfidenceAttackInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("confidence-inspection", base),
  });
}
