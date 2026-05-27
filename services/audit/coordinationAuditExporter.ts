import type { CoordinationReplayResult } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function exportCoordinationAudit(result: CoordinationReplayResult): Readonly<{
  exportId: string;
  replayId: string;
  auditId: string;
  deterministicHash: string;
  payload: CoordinationReplayResult;
}> {
  const payload = Object.freeze(result);
  return Object.freeze({
    exportId: hashCoordinationReplayValue("audit-export-id", {
      replayId: result.replayId,
      auditId: result.audit.auditId,
    }),
    replayId: result.replayId,
    auditId: result.audit.auditId,
    deterministicHash: hashCoordinationReplayValue("audit-export", payload),
    payload,
  });
}
