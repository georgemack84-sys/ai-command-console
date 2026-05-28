import type { CoordinationFrameworkError, CoordinationFrameworkErrorCode } from "@/types/bounded-coordination-framework";

export function createCoordinationError(
  code: CoordinationFrameworkErrorCode,
  message: string,
  path?: string,
): CoordinationFrameworkError {
  return Object.freeze({ code, message, path });
}
