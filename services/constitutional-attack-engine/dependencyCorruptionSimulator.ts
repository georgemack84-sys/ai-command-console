import type {
  AttackViolation,
  ConstitutionalAttackEngineInput,
  ConstitutionalAttackError,
  ConstitutionalWeakness,
} from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

function error(
  code: ConstitutionalAttackError["code"],
  message: string,
  path?: string,
): ConstitutionalAttackError {
  return Object.freeze({ code, message, path });
}

export function simulateDependencyCorruption(input: ConstitutionalAttackEngineInput): {
  dependencySafe: boolean;
  errors: readonly ConstitutionalAttackError[];
  violations: readonly AttackViolation[];
  weaknesses: readonly ConstitutionalWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const dependencySafe =
    !serialized.includes("staledependency")
    && !serialized.includes("brokendependency")
    && !serialized.includes("circulardependency")
    && !serialized.includes("corruptdependency")
    && !serialized.includes("replaydependencymismatch");
  if (dependencySafe) {
    return Object.freeze({
      dependencySafe: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }

  return Object.freeze({
    dependencySafe: false,
    errors: Object.freeze([
      error(
        "ATTACK_DEPENDENCY_RECONSTRUCTION_BLOCKED",
        "Dependency corruption blocked deterministic replay-safe reconstruction.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashConstitutionalAttackValue("dependency-violation-id", input.attackId),
        attackId: input.attackId,
        coordinationId: input.coordinationRecord.coordinationId,
        domain: "dependency",
        severity: "high",
        createdAt: input.createdAt,
        deterministicHash: hashConstitutionalAttackValue("dependency-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashConstitutionalAttackValue("dependency-weakness-id", input.attackId),
        attackId: input.attackId,
        classification: "DEPENDENCY_INTEGRITY_RISK",
        severity: "HIGH",
        rationale: "Dependency lineage could not be reconstructed deterministically.",
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("dependency-weakness", serialized),
      }),
    ]),
  });
}
