import type { EscalationDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectEscalationDrift(input: {
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
}): EscalationDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("escalation-drift-inspection", input),
  });
}
