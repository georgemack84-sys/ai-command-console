import type { VersioningFailure, VersioningFailureCode } from "./versioning-types";

export function createVersioningFailure(
  code: VersioningFailureCode,
  message: string,
  path?: string,
): VersioningFailure {
  return { code, message, path };
}
