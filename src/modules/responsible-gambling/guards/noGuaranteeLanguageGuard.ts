import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function enforceNoGuaranteeLanguage(output: string) {
  return classifyGamblingOutput({ requested_output: output });
}
