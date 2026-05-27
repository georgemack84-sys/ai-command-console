import type { GovernanceAttackInspection } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "@/services/constitutional-attack-engine/deterministicAttackHasher";

export function inspectGovernanceAttack(input: {
  governanceSnapshotId: string;
  governanceLinked: boolean;
}): GovernanceAttackInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("governance-inspection", base),
  });
}
