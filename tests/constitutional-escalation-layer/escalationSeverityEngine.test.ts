import { describe, expect, it } from "vitest";
import { deriveEscalationSeverity } from "@/services/constitutional-escalation-layer";
import type { ConstitutionalEscalationEvidence } from "@/types/constitutional-escalation-layer";

describe("deriveEscalationSeverity", () => {
  it("raises severity when confidence degrades", () => {
    const evidence: ConstitutionalEscalationEvidence = Object.freeze({
      evidenceId: "unused",
      evidenceRefs: Object.freeze(["evidence-1"]),
      triggerIds: [],
      confidenceLineageHash: "confidence-1",
      governanceSnapshotHash: "governance-1",
      overrideLineageHash: "override",
      proposalLineageHash: "proposal",
      snapshotLineageHash: "snapshot",
      topologyLineageHash: "topology",
      topologyHash: "graph",
      replayReconstructionHash: "replay",
      riskTooHigh: false,
      confidenceTooLow: true,
      policyMismatch: false,
      replayUnsafe: false,
      recursiveTopology: false,
      hiddenDelegationPath: false,
      branchFactorOverflow: false,
      depthOverflow: false,
      authorityDrift: false,
      topologyAmbiguous: false,
      missingOverrideReachability: false,
      unknownState: false,
      suggestedMinimumSeverity: "E2",
      createdAt: "2026-05-16T18:03:00.000Z",
    });

    expect(deriveEscalationSeverity(evidence)).toBe("E2");
  });
});
