import type { CoordinationGovernanceError, CoordinationGovernanceErrorCode } from "@/types/intent-coordination-governance-core";

export function createCoordinationGovernanceError(
  code: CoordinationGovernanceErrorCode,
  message: string,
  path?: string,
): CoordinationGovernanceError {
  return Object.freeze({ code, message, path });
}
