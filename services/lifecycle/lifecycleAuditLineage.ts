import type { LifecycleAuditEvent, LifecycleTransitionRecord } from "@/types/lifecycle";
import { buildLifecycleHash } from "./lifecycleHasher";

export function buildLifecycleAuditEvents(input: {
  record: LifecycleTransitionRecord;
  createdAt: string;
}): readonly LifecycleAuditEvent[] {
  const eventType = input.record.governanceDecision === "ALLOW"
    ? "lifecycle.transition.recorded"
    : "lifecycle.transition.rejected";

  return Object.freeze([
    Object.freeze({
      eventId: buildLifecycleHash("lifecycle-audit-event-id", {
        proposalId: input.record.proposalId,
        eventType,
        createdAt: input.createdAt,
      }),
      eventType,
      proposalId: input.record.proposalId,
      transitionId: input.record.transitionId,
      lifecycleHash: input.record.lifecycleHash || input.record.transitionId,
      createdAt: input.createdAt,
      eventHash: buildLifecycleHash("lifecycle-audit-event", {
        proposalId: input.record.proposalId,
        transitionId: input.record.transitionId,
        eventType,
        createdAt: input.createdAt,
      }),
    }),
  ]);
}
