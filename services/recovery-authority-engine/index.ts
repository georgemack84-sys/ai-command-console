import type { ConstitutionalGovernanceInput, RecoveryAuthorization } from "@/types/constitutional-governance";

export function evaluateRecoveryAuthority(input: ConstitutionalGovernanceInput): RecoveryAuthorization {
  const lineageValid = input.replay.status === "RECONSTRUCTED"
    && input.snapshots.some((snapshot) => snapshot.snapshotType === "revocation");
  const blockedReasons = [
    ...(lineageValid ? [] : ["revocation-lineage-missing"]),
    ...(input.policyExplanation.finalDecision === "approved" ? [] : ["governance-approval-required"]),
    ...(input.consoleView.recovery.data.readiness === "blocked" ? ["recovery-blocked"] : []),
  ];

  return Object.freeze({
    decision: blockedReasons.length ? "DENY" : "ESCALATE",
    approvalRequired: true,
    blastRadius: blockedReasons.includes("recovery-blocked") ? "high" : "bounded",
    lineageValid,
    blockedReasons: Object.freeze(blockedReasons),
    evidenceLinks: Object.freeze([
      {
        label: "Recovery visibility",
        authority: "console.operator-recovery" as const,
        hash: input.treaty.manifest.survivabilityHash,
        ref: input.executionId,
      },
      {
        label: "Approval chain",
        authority: "4.3O.execution-treaty" as const,
        hash: input.treaty.manifest.approvalChainHash,
        ref: input.treaty.manifest.treatyId,
      },
    ]),
  });
}
