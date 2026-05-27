import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import type {
  ProposalFreezeEvent,
  ProposalFreezeLineageEntry,
  ProposalFreezeLineageLog,
  ProposalFreezeRecord,
} from "./types/proposalFreezeTypes";

export function appendFreezeLineage(input: {
  proposalId: string;
  existing?: ProposalFreezeLineageLog;
  freezeRecord: ProposalFreezeRecord;
  freezeEvents: readonly ProposalFreezeEvent[];
  createdAt: string;
}): ProposalFreezeLineageLog {
  const newEntries: ProposalFreezeLineageEntry[] = input.freezeEvents.map((event) => Object.freeze({
    lineageEntryId: `${input.freezeRecord.freezeId}:${event.freezeEventId}`,
    proposalId: input.proposalId,
    freezeId: input.freezeRecord.freezeId,
    freezeEventId: event.freezeEventId,
    freezeState: input.freezeRecord.freezeState,
    createdAt: input.createdAt,
    deterministicHash: hashProposalFreezeValue("proposal-freeze-lineage-entry", {
      freezeId: input.freezeRecord.freezeId,
      eventId: event.freezeEventId,
      freezeState: input.freezeRecord.freezeState,
    }),
  }));

  const entries = Object.freeze([...(input.existing?.entries ?? []), ...newEntries]);
  return Object.freeze({
    lineageId: input.existing?.lineageId ?? `proposal-freeze-lineage:${input.proposalId}`,
    proposalId: input.proposalId,
    entries,
    lineageHash: hashProposalFreezeValue("proposal-freeze-lineage", entries.map((entry) => entry.deterministicHash)),
  });
}
