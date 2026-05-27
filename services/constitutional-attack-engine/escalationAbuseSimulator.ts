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

export function simulateEscalationAbuse(input: ConstitutionalAttackEngineInput): {
  escalationSafe: boolean;
  errors: readonly ConstitutionalAttackError[];
  violations: readonly AttackViolation[];
  weaknesses: readonly ConstitutionalWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const escalationSafe =
    input.escalationResult.lineage.entries.length > 0
    && !serialized.includes("escalationloop")
    && !serialized.includes("downgradeescalation")
    && !serialized.includes("suppressescalation");
  if (escalationSafe) {
    return Object.freeze({
      escalationSafe: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }

  return Object.freeze({
    escalationSafe: false,
    errors: Object.freeze([
      error(
        "ATTACK_ESCALATION_OVERSIGHT_REDUCTION",
        "Escalation abuse markers attempted to reduce oversight or corrupt escalation lineage.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashConstitutionalAttackValue("escalation-violation-id", input.attackId),
        attackId: input.attackId,
        coordinationId: input.coordinationRecord.coordinationId,
        domain: "escalation",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashConstitutionalAttackValue("escalation-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashConstitutionalAttackValue("escalation-weakness-id", input.attackId),
        attackId: input.attackId,
        classification: "ESCALATION_ABUSE_RISK",
        severity: "CRITICAL",
        rationale: "Escalation ambiguity reduced oversight instead of increasing it.",
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("escalation-weakness", serialized),
      }),
    ]),
  });
}
