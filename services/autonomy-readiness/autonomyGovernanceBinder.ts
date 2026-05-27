import type { AutonomyReadinessInput, GovernanceBinding } from "@/types/autonomy-readiness";

export function bindAutonomyGovernance(input: AutonomyReadinessInput): GovernanceBinding {
  const lineageMissing = !input.governanceView.policy.governanceLineageHash
    || !input.governanceView.policy.approvalLineageHash
    || !input.governanceView.policy.authorityLineageHash
    || !input.governanceView.policy.policySnapshotHash;
  const disputed = lineageMissing || input.governanceView.state !== "ALLOW" || input.governanceView.violations.length > 0;
  const latestDecision = input.governanceView.decisions.at(-1);

  return Object.freeze({
    governanceDecisionHash: latestDecision?.constitutionalDecisionHash ?? input.governanceView.constitutionalDecisionHash,
    policySnapshotHash: input.governanceView.policy.policySnapshotHash,
    governanceLineageHash: input.governanceView.policy.governanceLineageHash,
    approvalLineageHash: input.governanceView.policy.approvalLineageHash,
    authorityLineageHash: input.governanceView.policy.authorityLineageHash,
    sourceState: input.governanceView.state,
    disputed,
  });
}
