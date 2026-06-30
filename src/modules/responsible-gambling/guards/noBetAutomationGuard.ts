import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function enforceNoBetAutomation(output: string) {
  return classifyGamblingOutput({ requested_output: output });
}
