import { hashValidationValue } from "./validationHashEngine";

export function hashValidationAuditValue(scope: string, value: unknown): string {
  return hashValidationValue(`recommendation-validation-audit:${scope}`, value);
}
