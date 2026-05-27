import type { IntakeFailureType } from "@/types/intent/IntakeFailureType";
import type { IntakeSafetyInspection } from "@/types/intent/IntakeSafetyInspection";

export const INTAKE_ALLOWED_SOURCES = ["user", "system", "automation", "recovery"] as const;
export const INTAKE_ALLOWED_ENCODING = "utf-8" as const;
export const INTAKE_MAX_PAYLOAD_BYTES = 32_768;
export const INTAKE_MAX_RECURSION_DEPTH = 6;

export type IntakeSource = (typeof INTAKE_ALLOWED_SOURCES)[number];

export function isAllowedIntakeSource(value: string): value is IntakeSource {
  return INTAKE_ALLOWED_SOURCES.includes(value as IntakeSource);
}

export function resolveIntakeFailure(input: {
  sourceValid: boolean;
  inspection: IntakeSafetyInspection;
  normalizationFailed?: boolean;
  validationFailed?: boolean;
}): IntakeFailureType | null {
  if (!input.sourceValid) {
    return "INVALID_SOURCE";
  }
  if (input.inspection.malformedEncoding) {
    return "UNSUPPORTED_ENCODING";
  }
  if (input.inspection.exceedsLimits) {
    return "PAYLOAD_TOO_LARGE";
  }
  if (input.inspection.containsRecursivePayload) {
    return "RECURSION_LIMIT_EXCEEDED";
  }
  if (
    input.inspection.containsBinaryData
    || input.inspection.containsScriptContent
    || input.inspection.containsShellContent
  ) {
    return "SAFETY_REJECTION";
  }
  if (input.normalizationFailed) {
    return "NORMALIZATION_FAILURE";
  }
  if (input.validationFailed) {
    return "VALIDATION_FAILURE";
  }
  return null;
}

export function shouldRequireIsolationReview(inspection: IntakeSafetyInspection) {
  return inspection.containsShellContent || inspection.containsScriptContent || inspection.containsBinaryData;
}
