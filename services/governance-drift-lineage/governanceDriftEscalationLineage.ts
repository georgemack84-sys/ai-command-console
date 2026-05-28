import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function buildGovernanceDriftEscalationLineage(input: {
  escalationLineageId: string;
  escalationState: string;
}) {
  return Object.freeze({
    escalationLineageId: input.escalationLineageId,
    escalationState: input.escalationState,
    escalationHash: hashGovernanceDriftValue("escalation-lineage", input),
  });
}
