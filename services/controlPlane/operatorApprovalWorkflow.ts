import type { OperatorReviewQueueItem } from "./operatorReviewQueue";

export type OperatorApprovalPacket = {
  approvalPacketId: string;
  targetId: string;
  approvalRequired: boolean;
  submissionEnabled: false;
  constitutionalReasoning: string[];
  governanceReferences: string[];
  blockedReasons: string[];
};

export function buildOperatorApprovalPacket(review: OperatorReviewQueueItem): OperatorApprovalPacket {
  return {
    approvalPacketId: `approval:${review.reviewId}`,
    targetId: review.targetId,
    approvalRequired: true,
    submissionEnabled: false,
    constitutionalReasoning: review.constitutionalReasoning,
    governanceReferences: review.governanceReferences,
    blockedReasons: review.blockedReasons,
  };
}
