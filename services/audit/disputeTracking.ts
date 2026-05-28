import type { GovernanceDisputeState } from "../../types/audit";

export type GovernanceDisputeRecord = {
  disputeId: string;
  state: GovernanceDisputeState;
  category: string;
  evidenceRefs: string[];
  timestamp: string;
};

export function createDisputeRecord(input: {
  category: string;
  state: GovernanceDisputeState;
  evidenceRefs: string[];
  timestamp: string;
}) : GovernanceDisputeRecord {
  return {
    disputeId: `dispute:${input.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}:${input.timestamp}`,
    state: input.state,
    category: input.category,
    evidenceRefs: Array.from(new Set(input.evidenceRefs)).sort(),
    timestamp: input.timestamp,
  };
}

export function transitionDisputeRecord(input: {
  record: GovernanceDisputeRecord;
  nextState: GovernanceDisputeState;
}) : GovernanceDisputeRecord {
  return {
    ...input.record,
    state: input.nextState,
  };
}
