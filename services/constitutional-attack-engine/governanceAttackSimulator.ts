import type {
  ConstitutionalAttackEngineInput,
  ConstitutionalAttackError,
  AttackViolation,
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

export function simulateGovernanceAttack(input: ConstitutionalAttackEngineInput): {
  governanceLinked: boolean;
  errors: readonly ConstitutionalAttackError[];
  violations: readonly AttackViolation[];
  weaknesses: readonly ConstitutionalWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const governanceLinked =
    input.coordinationRecord.governanceSnapshotId === input.coordinationReplay.governance.governanceSnapshotId
    && input.coordinationRecord.governanceSnapshotId === input.boundaryResult.record.governanceSnapshotId
    && !serialized.includes("bypassgovernance")
    && !serialized.includes("stalegovernance")
    && !serialized.includes("substitutegovernance")
    && !serialized.includes("mutategovernance");
  if (governanceLinked) {
    return Object.freeze({
      governanceLinked: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }

  return Object.freeze({
    governanceLinked: false,
    errors: Object.freeze([
      error(
        "ATTACK_GOVERNANCE_LINKAGE_MISSING",
        "Governance linkage was missing, stale, substituted, or bypassed during attack simulation.",
        "governanceSnapshotId",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashConstitutionalAttackValue("governance-violation-id", input.attackId),
        attackId: input.attackId,
        coordinationId: input.coordinationRecord.coordinationId,
        domain: "governance",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashConstitutionalAttackValue("governance-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashConstitutionalAttackValue("governance-weakness-id", input.attackId),
        attackId: input.attackId,
        classification: "GOVERNANCE_BYPASS_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: "Governance linkage was not immutable across simulated artifacts.",
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("governance-weakness", serialized),
      }),
    ]),
  });
}
