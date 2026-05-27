import type { ConstitutionalEscalationError, ConstitutionalEscalationErrorCode } from "@/types/constitutional-escalation-layer";

export function createEscalationError(
  code: ConstitutionalEscalationErrorCode,
  message: string,
  path?: string,
): ConstitutionalEscalationError {
  return Object.freeze({ code, message, path });
}
