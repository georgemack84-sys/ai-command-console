import { assessContractCompatibility } from "./contractCompatibility";

export function validateReplayCompatibility(input: {
  fromVersion: string;
  toVersion: string;
}) {
  return assessContractCompatibility({
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    changes: [],
  });
}
