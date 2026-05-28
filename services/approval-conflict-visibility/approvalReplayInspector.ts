import type { ApprovalConflictReplayInspection } from "@/types/approval-conflict";
import { hashApprovalConflictValue } from "@/services/approval-conflict/deterministicApprovalConflictHasher";

export function inspectApprovalReplay(input: {
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
}): ApprovalConflictReplayInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashApprovalConflictValue("approval-replay-inspection", input),
  });
}
