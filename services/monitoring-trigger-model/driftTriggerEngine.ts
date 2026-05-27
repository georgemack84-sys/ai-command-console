import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { MonitoringTrigger } from "@/types/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { hashTriggerValue } from "./triggerHasher";

export function deriveDriftTrigger(input: {
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  confidenceScore: number;
  replayBindings: readonly string[];
  governanceBindings: readonly string[];
  overrideBindings: readonly string[];
  lineageHash: string;
  createdAt: string;
}): MonitoringTrigger | undefined {
  const driftEvidence = [
    ...input.proposal.errors.map((error) => error.code),
    ...input.approvalGraph.errors.map((error) => error.code),
    ...input.overrideContract.errors.map((error) => error.code),
  ].filter((code) => /DRIFT|LINEAGE|MISMATCH|DISPUTED|BROKEN/i.test(code));

  if (driftEvidence.length === 0) {
    return undefined;
  }

  const severity = driftEvidence.length > 2 ? "critical" : "high";
  return Object.freeze({
    triggerId: hashTriggerValue("monitoring-trigger-drift-id", {
      driftEvidence,
      createdAt: input.createdAt,
      lineageHash: input.lineageHash,
    }),
    triggerType: "drift",
    severity,
    cautionState: severity === "critical" ? "frozen-recommended" : "escalated",
    confidenceScore: input.confidenceScore,
    replayBindings: input.replayBindings,
    governanceBindings: input.governanceBindings,
    overrideBindings: input.overrideBindings,
    evidenceHashes: Object.freeze(driftEvidence.map((entry) => hashTriggerValue("monitoring-trigger-drift-evidence", entry))),
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });
}
