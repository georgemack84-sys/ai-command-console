import type { CoordinationFreezeRecord, FreshnessAuditEvent, ProposalFreshnessState } from "@/types/freshness";
import { hashFreshnessValue } from "./freshnessHasher";

export function buildFreshnessAuditEvents(input: {
  state: ProposalFreshnessState;
  freeze: CoordinationFreezeRecord;
  stateHash: string;
  createdAt: string;
}): readonly FreshnessAuditEvent[] {
  const events: FreshnessAuditEvent[] = [];
  const freshnessEventType =
    input.state.freshnessStatus === "fresh" ? "freshness.validated"
    : input.state.freshnessStatus === "revalidation_required" ? "freshness.revalidation-required"
    : input.state.freshnessStatus === "stale" ? "freshness.stale"
    : input.state.freshnessStatus === "expired" ? "freshness.expired"
    : "freshness.frozen";

  events.push(Object.freeze({
    eventId: hashFreshnessValue("freshness-audit-event-id", {
      proposalId: input.state.proposalId,
      freshnessEventType,
      createdAt: input.createdAt,
    }),
    eventType: freshnessEventType,
    proposalId: input.state.proposalId,
    stateHash: input.stateHash,
    createdAt: input.createdAt,
    eventHash: hashFreshnessValue("freshness-audit-event", {
      proposalId: input.state.proposalId,
      eventType: freshnessEventType,
      createdAt: input.createdAt,
    }),
  }));

  for (const drift of input.state.detectedDrifts) {
    events.push(Object.freeze({
      eventId: hashFreshnessValue("freshness-drift-event-id", {
        proposalId: input.state.proposalId,
        driftId: drift.driftId,
        createdAt: input.createdAt,
      }),
      eventType: drift.driftType === "replay" && !drift.replaySafe ? "replay.quarantined" : "drift.detected",
      proposalId: input.state.proposalId,
      stateHash: input.stateHash,
      createdAt: input.createdAt,
      eventHash: hashFreshnessValue("freshness-drift-event", {
        proposalId: input.state.proposalId,
        driftId: drift.driftId,
        createdAt: input.createdAt,
      }),
    }));
  }

  if (input.freeze.frozen) {
    events.push(Object.freeze({
      eventId: hashFreshnessValue("freshness-freeze-event-id", {
        proposalId: input.state.proposalId,
        createdAt: input.createdAt,
      }),
      eventType: "freshness.frozen",
      proposalId: input.state.proposalId,
      stateHash: input.stateHash,
      createdAt: input.createdAt,
      eventHash: hashFreshnessValue("freshness-freeze-event", {
        proposalId: input.state.proposalId,
        freezeHash: input.freeze.freezeHash,
        createdAt: input.createdAt,
      }),
    }));
  }

  return Object.freeze(events);
}
