import type { ConfidenceDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectConfidenceDrift(input: {
  confidenceLinked: boolean;
  confidenceSafe: boolean;
}): ConfidenceDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("confidence-drift-inspection", input),
  });
}
