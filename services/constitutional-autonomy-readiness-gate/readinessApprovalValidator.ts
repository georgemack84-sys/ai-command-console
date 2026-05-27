import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessApproval(input: {
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
}): Readonly<{
  approvalValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const approvalValid =
    input.proposal.approval.valid
    && input.approvalGraph.valid
    && input.approvalGraph.nodes.every((node) => node.approvalState === "satisfied");

  return Object.freeze({
    approvalValid,
    reasons: Object.freeze(
      approvalValid ? ["Approval topology is complete and satisfied."] : ["Approval lineage is pending, denied, revoked, or expired."],
    ),
    errors: Object.freeze(
      approvalValid ? [] : [createReadinessError("AUTONOMY_APPROVAL_REQUIRED", "Autonomy readiness requires complete approval topology.", "approvalGraph")],
    ),
  });
}
