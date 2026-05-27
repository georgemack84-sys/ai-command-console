import type { ConstitutionalAttackEngineInput, ConstitutionalAttackError, ConstitutionalWeakness } from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

export function classifyConstitutionalWeaknesses(input: {
  attackInput: ConstitutionalAttackEngineInput;
  errors: readonly ConstitutionalAttackError[];
  inheritedWeaknesses: readonly ConstitutionalWeakness[];
}): readonly ConstitutionalWeakness[] {
  const generated: ConstitutionalWeakness[] = [];
  for (const item of input.errors) {
    if (item.code.includes("AUTHORITY")) {
      generated.push(Object.freeze({
        weaknessId: hashConstitutionalAttackValue("authority-weakness-id", item),
        attackId: input.attackInput.attackId,
        classification: "AUTHORITY_EXPANSION_RISK" as const,
        severity: "CONSTITUTIONAL_BLOCKER" as const,
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("authority-weakness", item),
      }));
      continue;
    }
    if (item.code.includes("EXECUTION") || item.code.includes("SCHEDULER") || item.code.includes("ISOLATION")) {
      generated.push(Object.freeze({
        weaknessId: hashConstitutionalAttackValue("isolation-weakness-id", item),
        attackId: input.attackInput.attackId,
        classification: "ISOLATION_BOUNDARY_RISK" as const,
        severity: "CONSTITUTIONAL_BLOCKER" as const,
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("isolation-weakness", item),
      }));
      continue;
    }
    if (item.code.includes("ORCHESTRATION")) {
      generated.push(Object.freeze({
        weaknessId: hashConstitutionalAttackValue("orchestration-weakness-id", item),
        attackId: input.attackInput.attackId,
        classification: "ORCHESTRATION_DRIFT_RISK" as const,
        severity: "CRITICAL" as const,
        rationale: item.message,
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("orchestration-weakness", item),
      }));
      continue;
    }
  }

  return Object.freeze(
    [...input.inheritedWeaknesses, ...generated].sort((left, right) =>
      left.deterministicHash.localeCompare(right.deterministicHash),
    ),
  );
}
