import { describe, expect, it } from "vitest";

import { prepareProposalHandoff } from "@/services/proposal-lifecycle-engine";

describe("proposalHandoffPreparer", () => {
  it("produces governance-only handoff packages", () => {
    const result = prepareProposalHandoff({
      proposalId: "proposal-001",
      missionId: "mission-001",
      executionId: "execution-001",
      resultingState: "prepared_handoff",
      timestamp: "2026-05-16T15:05:00.000Z",
      governanceBinding: Object.freeze({
        governanceDecisionHash: "gov",
        policySnapshotHash: "policy",
        governanceLineageHash: "gov-lineage",
        approvalLineageHash: "approval-lineage",
        authorityLineageHash: "authority-lineage",
        sourceState: "ALLOW",
        valid: true,
        disputed: false,
      }),
      replayBinding: Object.freeze({
        reconstructionHash: "replay",
        replaySnapshotHash: "replay-snapshot",
        replayLineageHash: "replay-lineage",
        readinessHash: "readiness",
        snapshotLineageHash: "snapshot-lineage",
        deterministic: true,
        valid: true,
        disputed: false,
      }),
      snapshotBinding: Object.freeze({
        snapshotLineageHashes: Object.freeze(["lineage-001"]),
        snapshotLineageHash: "snapshot-lineage",
        valid: true,
        disputed: false,
      }),
      safeActionBinding: Object.freeze({
        safeActionId: "safe-action:prepare_handoff",
        safeActionHash: "safe-action-hash",
        category: "prepare_handoff",
        riskClass: "handoff_preparation",
        valid: true,
        futureBound: false,
        forbidden: false,
      }),
      approval: Object.freeze({
        approvalId: "approval-001",
        status: "approved",
        explicit: true,
        approvers: Object.freeze(["operator-01"]),
        scopeHash: "scope",
        governanceDecisionHash: "gov",
        valid: true,
      }),
    });
    expect(result.handoff?.executionPayloadIncluded).toBe(false);
    expect(result.handoff?.dispatchMetadataIncluded).toBe(false);
  });
});
