import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function enforceNoMisleadingConfidence(output: string) {
  return classifyGamblingOutput({ requested_output: output });
}
