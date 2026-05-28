import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { GovernanceFailure, GovernanceProvenanceEvent, GovernanceProvenanceEventType } from "./governanceTypes";

export function buildGovernanceProvenanceEvent(input: {
  eventType: GovernanceProvenanceEventType;
  governanceHash: string;
  previousEventHash: string | null;
  payload: Readonly<Record<string, unknown>>;
}): GovernanceProvenanceEvent {
  const event = {
    eventType: input.eventType,
    governanceHash: input.governanceHash,
    previousEventHash: input.previousEventHash,
    payload: input.payload,
  } as const;

  return {
    ...event,
    eventHash: hashStableContent("GOVERNANCE", event),
  };
}

export function validateGovernanceProvenanceLedger(events: readonly GovernanceProvenanceEvent[]): readonly GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  let previousHash: string | null = null;

  for (const event of events) {
    if (event.previousEventHash !== previousHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
        message: "governance provenance continuity mismatch",
      });
    }
    const expectedHash = hashStableContent("GOVERNANCE", {
      eventType: event.eventType,
      governanceHash: event.governanceHash,
      previousEventHash: event.previousEventHash,
      payload: event.payload,
    });
    if (expectedHash !== event.eventHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_PROVENANCE_INVALID",
        message: "governance provenance hash mismatch",
      });
    }
    previousHash = event.eventHash;
  }

  return failures;
}
