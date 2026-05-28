import type { ConstitutionalReadinessError, ConstitutionalReadinessErrorCode } from "@/types/constitutional-autonomy-readiness-gate";

export function createReadinessError(
  code: ConstitutionalReadinessErrorCode,
  message: string,
  path?: string,
): ConstitutionalReadinessError {
  return Object.freeze({ code, message, path });
}
