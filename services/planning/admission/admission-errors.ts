import type { AdmissionFailure, AdmissionFailureCode } from "./admission-types";

export function createAdmissionFailure(
  code: AdmissionFailureCode,
  message: string,
  path?: string,
): AdmissionFailure {
  return {
    code,
    message,
    path,
  };
}
