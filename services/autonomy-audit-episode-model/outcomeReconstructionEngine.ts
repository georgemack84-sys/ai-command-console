import type { AuditOutcome } from "@/types/autonomy-audit-episode-model";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";

export function reconstructAuditOutcome(input: {
  proposal: ProposalRecord;
  overrideContract: OverrideContractRecord;
  monitoringModel: MonitoringTriggerModel;
  createdAt: string;
}): AuditOutcome {
  let state: AuditOutcome["state"];
  if (input.proposal.resultingState === "archived") {
    state = "archived";
  } else if (input.proposal.revocation.status === "revoked") {
    state = "revoked";
  } else if (input.overrideContract.killSwitch || input.monitoringModel.cautionState === "frozen-recommended") {
    state = "frozen";
  } else if (input.proposal.resultingState === "approved") {
    state = "approved";
  } else if (input.proposal.resultingState === "denied") {
    state = "denied";
  } else if (input.monitoringModel.cautionState === "escalated") {
    state = "escalated";
  } else if (input.proposal.approval.status === "expired") {
    state = "expired";
  } else {
    state = "superseded";
  }

  const summary =
    state === "frozen"
      ? "Outcome remains constitutionally frozen as evidence only."
      : state === "escalated"
        ? "Outcome requires additional human review."
        : `Outcome reconstructed as ${state}.`;

  return Object.freeze({
    outcomeId: hashAuditEpisodeValue("autonomy-audit-outcome-id", {
      proposalHash: input.proposal.proposalHash,
      state,
      createdAt: input.createdAt,
    }),
    state,
    summary,
    evidenceHashes: Object.freeze([
      input.proposal.proposalHash,
      input.overrideContract.overrideHash,
      input.monitoringModel.triggerHash,
    ]),
    createdAt: input.createdAt,
  });
}
