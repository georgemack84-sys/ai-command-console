import type { OperatorAuthorityForensicExport } from "./types/operatorAuthorityTypes";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

export function exportOperatorAuthorityForensics(input: {
  actionId: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
}): OperatorAuthorityForensicExport {
  return Object.freeze({
    exportId: hashOverrideAuditValue("operator-authority-forensics-id", {
      actionId: input.actionId,
    }),
    actionId: input.actionId,
    replayHash: input.replayHash,
    auditHash: input.auditHash,
    lineageHash: input.lineageHash,
    exportHash: hashOverrideAuditValue("operator-authority-forensics", input),
  });
}
