import type { GovernanceDriftBoundaryInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectGovernanceDriftBoundary(input: {
  topologyFrozen: boolean;
  isolationSafe: boolean;
}): GovernanceDriftBoundaryInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("governance-drift-boundary-inspection", input),
  });
}
