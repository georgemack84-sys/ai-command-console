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

export function simulateConfidenceSpoof(input: ConstitutionalAttackEngineInput): {
  confidenceSafe: boolean;
  confidenceLinked: boolean;
  errors: readonly ConstitutionalAttackError[];
  violations: readonly AttackViolation[];
  weaknesses: readonly ConstitutionalWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const confidenceLinked = !serialized.includes("fabricateconfidence") && !serialized.includes("confidencemismatch");
  const confidenceSafe = confidenceLinked && !serialized.includes("confidenceauthority") && !serialized.includes("confidenceexpansion");
  const errors: ConstitutionalAttackError[] = [];
  const violations: AttackViolation[] = [];
  const weaknesses: ConstitutionalWeakness[] = [];

  if (!confidenceLinked || !confidenceSafe) {
    weaknesses.push(Object.freeze({
      weaknessId: hashConstitutionalAttackValue("confidence-weakness-id", input.attackId),
      attackId: input.attackId,
      classification: "CONFIDENCE_SPOOF_RISK",
      severity: confidenceSafe ? "MEDIUM" : "CRITICAL",
      rationale: "Confidence simulation attempted to fabricate or weaponize confidence signals.",
      advisoryOnly: true as const,
      deterministicHash: hashConstitutionalAttackValue("confidence-weakness", serialized),
    }));
  }
  if (!confidenceSafe) {
    errors.push(error(
      "ATTACK_CONFIDENCE_AUTHORITY_EXPANSION",
      "Confidence attempted to create or justify authority expansion.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashConstitutionalAttackValue("confidence-violation-id", input.attackId),
      attackId: input.attackId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "confidence",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashConstitutionalAttackValue("confidence-violation", serialized),
    }));
  }

  return Object.freeze({
    confidenceSafe,
    confidenceLinked,
    errors: Object.freeze(errors),
    violations: Object.freeze(violations),
    weaknesses: Object.freeze(weaknesses),
  });
}
