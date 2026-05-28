import { canonicalizeProposalFreezeToString } from "./proposalFreezeCanonicalizer";
import { hashProposalFreezeValue } from "./proposalFreezeHasher";
import {
  serializeProposalFreezeEvent,
  serializeProposalFreezeLineage,
  serializeProposalFreezeRecord,
} from "./proposalFreezeSerializer";
import type {
  ProposalFreezeError,
  ProposalFreezeEvent,
  ProposalFreezeLineageLog,
  ProposalFreezeRecord,
} from "./types/proposalFreezeTypes";

export function validateProposalFreezeDeterminism(input: {
  freezeRecord: ProposalFreezeRecord;
  freezeEvents: readonly ProposalFreezeEvent[];
  lineage: ProposalFreezeLineageLog;
}): readonly ProposalFreezeError[] {
  const stable =
    serializeProposalFreezeRecord(input.freezeRecord) === canonicalizeProposalFreezeToString(input.freezeRecord)
    && serializeProposalFreezeLineage(input.lineage) === canonicalizeProposalFreezeToString(input.lineage)
    && input.freezeEvents.every((event) =>
      serializeProposalFreezeEvent(event) === canonicalizeProposalFreezeToString(event));

  if (!stable) {
    return Object.freeze([{
      code: "PROPOSAL_FREEZE_FAIL_CLOSED" as const,
      message: "Proposal freeze serialization drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  const canonical = canonicalizeProposalFreezeToString({
    freezeRecord: input.freezeRecord,
    freezeEvents: input.freezeEvents,
    lineage: input.lineage,
  });
  const hashA = hashProposalFreezeValue("proposal-freeze-determinism", canonical);
  const hashB = hashProposalFreezeValue(
    "proposal-freeze-determinism",
    canonicalizeProposalFreezeToString(JSON.parse(canonical)),
  );

  if (hashA !== hashB) {
    return Object.freeze([{
      code: "PROPOSAL_FREEZE_FAIL_CLOSED" as const,
      message: "Proposal freeze hashing drifted under deterministic validation.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
