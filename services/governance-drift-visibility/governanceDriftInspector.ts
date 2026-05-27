import type { GovernanceDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectGovernanceDrift(input: {
  driftId: string;
  coordinationId: string;
  driftState: string;
  categories: readonly string[];
}): GovernanceDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("governance-drift-inspection", input),
  });
}
