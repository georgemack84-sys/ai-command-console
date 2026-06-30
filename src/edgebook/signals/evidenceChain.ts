import type { ChangeEvent } from "../ears/changeDetectionTypes";
import type { EvidenceChain } from "./signalTypes";

export function createEvidenceChain(events: ChangeEvent[]): EvidenceChain | null {
  if (events.length === 0) {
    return null;
  }

  const sourceIds = Array.from(new Set(events.map((event) => event.source_id))).sort();

  return {
    evidence_id: `evidence_${events.map((event) => event.change_event_id).join("_")}`,
    events: events.map((event) => ({ ...event })),
    source_ids: sourceIds,
    summary: `${events.length} verified change event(s) from ${sourceIds.length} attributed source(s).`,
  };
}
