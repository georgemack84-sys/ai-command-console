import type { CoordinationAuditEvent } from "@/types/intent-coordination-governance-core";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function buildCoordinationAuditEvents(input: {
  coordinationId: string;
  createdAt: string;
  replayHash: string;
  topologyHash: string;
  resultingState: string;
}): readonly CoordinationAuditEvent[] {
  const eventTypes = [
    "relationship_validated",
    "containment_validated",
    "transition_resolved",
    "replay_bound",
  ] as const;
  const events = eventTypes.map((eventType) => Object.freeze({
    eventId: hashCoordinationGovernanceValue("intent-coordination-audit-event-id", {
      coordinationId: input.coordinationId,
      eventType,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    eventType,
    eventHash: hashCoordinationGovernanceValue("intent-coordination-audit-event-hash", {
      eventType,
      replayHash: input.replayHash,
      topologyHash: input.topologyHash,
      resultingState: input.resultingState,
    }),
    createdAt: input.createdAt,
  }));
  return Object.freeze(events);
}
