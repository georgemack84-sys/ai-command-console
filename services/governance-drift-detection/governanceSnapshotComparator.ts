import type { GovernanceDriftInput, GovernanceDriftError } from "@/types/governance-drift";

export function compareGovernanceSnapshots(input: GovernanceDriftInput): Readonly<{
  governanceLinked: boolean;
  errors: readonly GovernanceDriftError[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("governancesubstitution")
    || markers.includes("stalegovernancelineage")
    || markers.includes("invalidgovernanceinheritance")
    || markers.includes("constitutionaldivergence")
    || input.replayAttackResult.errors.some((item) => item.code.includes("GOVERNANCE"));
  if (!drift) {
    return Object.freeze({
      governanceLinked: true,
      errors: Object.freeze([]),
    });
  }
  return Object.freeze({
    governanceLinked: false,
    errors: Object.freeze([Object.freeze({
      code: "GOVERNANCE_DRIFT_POLICY_DIVERGENCE" as const,
      message: "Governance divergence or substitution was detected in constitutional drift analysis.",
      path: "metadata",
    })]),
  });
}
