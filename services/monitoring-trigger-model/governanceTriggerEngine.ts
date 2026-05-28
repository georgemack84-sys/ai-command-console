import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTrigger } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

export function deriveGovernanceTrigger(input: {
  governanceView: ConstitutionalGovernanceView;
  confidenceScore: number;
  replayBindings: readonly string[];
  overrideBindings: readonly string[];
  createdAt: string;
  lineageHash: string;
}): MonitoringTrigger | undefined {
  if (input.governanceView.state === "ALLOW" && input.governanceView.errors.length === 0) {
    return undefined;
  }

  const severity = input.governanceView.state === "DENY" ? "critical" : "high";
  return Object.freeze({
    triggerId: hashTriggerValue("monitoring-trigger-governance-id", {
      governanceHash: input.governanceView.constitutionalDecisionHash,
      createdAt: input.createdAt,
    }),
    triggerType: "governance",
    severity,
    cautionState: severity === "critical" ? "frozen-recommended" : "escalated",
    confidenceScore: input.confidenceScore,
    replayBindings: input.replayBindings,
    governanceBindings: Object.freeze([
      input.governanceView.policy.policySnapshotHash,
      input.governanceView.policy.governanceLineageHash,
      input.governanceView.constitutionalDecisionHash,
    ]),
    overrideBindings: input.overrideBindings,
    evidenceHashes: Object.freeze(
      input.governanceView.violations.map((violation) => hashTriggerValue("monitoring-trigger-governance-violation", violation.code)),
    ),
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });
}
