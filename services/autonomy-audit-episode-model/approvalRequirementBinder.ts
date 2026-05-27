import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ApprovalRequirement } from "@/types/autonomy-audit-episode-model";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function bindApprovalRequirements(input: {
  approvalGraph: ApprovalDependencyGraph;
  createdAt: string;
}): readonly ApprovalRequirement[] {
  return Object.freeze(
    input.approvalGraph.nodes.map((node) =>
      Object.freeze({
        requirementId: hashAuditEpisodeValue("autonomy-audit-approval-requirement-id", {
          approvalId: node.approvalId,
          immutableHash: node.immutableHash,
          createdAt: input.createdAt,
        }),
        approvalId: node.approvalId,
        dependencyType: node.dependencyType,
        approvalState: node.approvalState,
        validFrom: node.timeWindow.validFrom,
        validUntil: node.timeWindow.validUntil,
        inheritedFrom: node.inheritedFrom,
        createdAt: input.createdAt,
      })),
  );
}
