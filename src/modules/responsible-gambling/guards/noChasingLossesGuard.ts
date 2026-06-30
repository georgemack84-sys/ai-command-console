import { classifyGamblingOutput } from "../classifier/gamblingOutputClassifier";

export function enforceNoChasingLosses(output: string) {
  return classifyGamblingOutput({ requested_output: output });
}
