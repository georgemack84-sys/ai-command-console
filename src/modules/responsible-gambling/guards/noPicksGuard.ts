import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function enforceNoPicks(output: string) {
  return classifyGamblingOutput({ requested_output: output });
}
