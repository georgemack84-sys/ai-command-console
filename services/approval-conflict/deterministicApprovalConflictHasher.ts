import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function hashApprovalConflictValue(scope: string, value: unknown): string {
  return hashCoordinationReplayValue(`approval-conflict:${scope}`, value);
}
