import type { ConstitutionalGovernanceInput, EscalationAuthority } from "@/types/constitutional-governance";

export function evaluateEscalationGovernance(input: ConstitutionalGovernanceInput): EscalationAuthority {
  const escalationRoutes = input.consoleView.approvals.data.escalationRoutes;
  const hasEscalationRoutes = escalationRoutes.length > 0;
  const overrideEligible = input.policyExplanation.finalDecision !== "approved";

  return Object.freeze({
    decision: hasEscalationRoutes ? "ESCALATE" : "DENY",
    pauseAuthority: true,
    overrideEligible,
    selfIssuedOverrideAllowed: false,
    escalationRoutes: Object.freeze([...escalationRoutes]),
    evidenceLinks: Object.freeze([
      {
        label: "Review route",
        authority: "control-plane.review" as const,
        hash: input.treaty.manifest.governanceSnapshotHash,
        ref: escalationRoutes[0],
      },
      {
        label: "Approval route",
        authority: "control-plane.approval" as const,
        hash: input.treaty.manifest.approvalChainHash,
        ref: escalationRoutes[1],
      },
    ]),
  });
}
