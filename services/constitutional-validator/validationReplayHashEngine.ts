import { hashValidationValue } from "./validationHashEngine";

export function hashValidationReplayValue(scope: string, value: unknown): string {
  return hashValidationValue(`recommendation-validation-replay:${scope}`, value);
}
