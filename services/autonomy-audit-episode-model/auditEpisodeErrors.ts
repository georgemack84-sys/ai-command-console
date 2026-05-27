import type { AutonomyAuditEpisodeError, AutonomyAuditEpisodeErrorCode } from "@/types/autonomy-audit-episode-model";

export function createAuditEpisodeError(
  code: AutonomyAuditEpisodeErrorCode,
  message: string,
  path?: string,
): AutonomyAuditEpisodeError {
  return Object.freeze({ code, message, path });
}
