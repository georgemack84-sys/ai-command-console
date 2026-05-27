import type { ReplayAuditFailure, ReplayAuditFailureCode } from "./replay-audit-types";

export function createReplayAuditFailure(
  code: ReplayAuditFailureCode,
  message: string,
  path?: string,
): ReplayAuditFailure {
  return { code, message, path };
}
