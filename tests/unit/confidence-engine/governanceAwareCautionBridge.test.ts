import { describe, expect, it } from "vitest";
import {
  buildGovernanceAwareCautionBridge,
  type GovernanceAwareCautionBridgeInput,
} from "@/services/confidence-engine/governanceAwareCautionBridge";
import { buildDeterministicConfidenceFixture } from "@/tests/integration/confidence-engine/helpers";

function buildInput(
  overrides: Partial<GovernanceAwareCautionBridgeInput> = {},
): GovernanceAwareCautionBridgeInput {
  const fixture = buildDeterministicConfidenceFixture();

  return Object.freeze({
    confidenceResult: fixture.result,
    confidenceClassification: fixture.result.score.classification,
    replayValidationState: "STABLE",
    governanceBindingState: "BOUND",
    lineageIntegrityState: "MATCHED",
    freezeState: "ACTIVE",
    revocationState: "NOT_REVOKED",
    proposalIntegrityState: "replay_verified",
    authorityAmbiguous: false,
    recommendationId: fixture.result.score.recommendationId,
    ...overrides,
  } satisfies GovernanceAwareCautionBridgeInput);
}

describe("governanceAwareCautionBridge", () => {
  it("produces deterministic advisory-only bridge output for identical inputs", () => {
    const input = buildInput();

    const first = buildGovernanceAwareCautionBridge(input);
    const second = buildGovernanceAwareCautionBridge(input);

    expect(first).toEqual(second);
    expect(first.advisoryOnly).toBe(true);
    expect(first.authorityChanged).toBe(false);
    expect(first.mutationPerformed).toBe(false);
    expect(first.controlledAutonomyTrajectoryPreserved).toBe(true);
  });

  it("maps confidence collapse to TIGHTEN_SCOPE", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      confidenceClassification: "very_low",
    }));

    expect(result.requiredAction).toBe("TIGHTEN_SCOPE");
    expect(result.reasonCodes).toContain("CONFIDENCE_COLLAPSE");
  });

  it("maps replay instability to INCREASE_ESCALATION", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      replayValidationState: "UNSTABLE",
    }));

    expect(result.requiredAction).toBe("INCREASE_ESCALATION");
    expect(result.reasonCodes).toContain("REPLAY_INSTABILITY");
  });

  it("maps governance conflict to FREEZE_RECOMMENDATION without performing a freeze", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      governanceBindingState: "DISPUTED",
    }));

    expect(result.requiredAction).toBe("FREEZE_RECOMMENDATION");
    expect(result.reasonCodes).toContain("GOVERNANCE_CONFLICT");
    expect(result.mutationPerformed).toBe(false);
  });

  it("maps authority ambiguity to REQUIRE_OPERATOR_REVIEW", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      authorityAmbiguous: true,
    }));

    expect(result.requiredAction).toBe("REQUIRE_OPERATOR_REVIEW");
    expect(result.reasonCodes).toContain("AUTHORITY_AMBIGUITY");
  });

  it("maps lineage mismatch to FAIL_CLOSED", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      lineageIntegrityState: "MISMATCHED",
    }));

    expect(result.requiredAction).toBe("FAIL_CLOSED");
    expect(result.failClosed).toBe(true);
    expect(result.replaySafe).toBe(false);
    expect(result.reasonCodes).toContain("LINEAGE_MISMATCH");
  });

  it("keeps frozen and revoked proposals contained without modifying containment state", () => {
    const frozen = buildGovernanceAwareCautionBridge(buildInput({
      freezeState: "FROZEN",
    }));
    const revoked = buildGovernanceAwareCautionBridge(buildInput({
      revocationState: "REVOKED",
    }));

    expect(frozen.requiredAction).toBe("FREEZE_RECOMMENDATION");
    expect(frozen.reasonCodes).toContain("PROPOSAL_FROZEN_CONTAINMENT");
    expect(frozen.mutationPerformed).toBe(false);
    expect(revoked.requiredAction).toBe("FREEZE_RECOMMENDATION");
    expect(revoked.reasonCodes).toContain("PROPOSAL_REVOKED_CONTAINMENT");
    expect(revoked.mutationPerformed).toBe(false);
  });

  it("does not mutate proposal or governance state inputs", () => {
    const input = buildInput({
      governanceBindingState: "BOUND",
      proposalIntegrityState: "replay_verified",
    });
    const before = JSON.stringify(input);

    buildGovernanceAwareCautionBridge(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import freeze or revocation writer engines", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("services/confidence-engine/governanceAwareCautionBridge.ts", "utf8")
    );

    expect(source).not.toContain("proposalFreezeEngine");
    expect(source).not.toContain("proposalRevocationEngine");
  });

  it("keeps advisory and authority containment fields immutable across all actions", () => {
    const inputs = [
      buildInput({ confidenceClassification: "low" }),
      buildInput({ replayValidationState: "UNSTABLE" }),
      buildInput({ governanceBindingState: "INVALID" }),
      buildInput({ authorityAmbiguous: true }),
      buildInput({ lineageIntegrityState: "MISMATCHED" }),
    ];

    for (const input of inputs) {
      const result = buildGovernanceAwareCautionBridge(input);

      expect(result.advisoryOnly).toBe(true);
      expect(result.authorityChanged).toBe(false);
      expect(result.mutationPerformed).toBe(false);
    }
  });

  it("lets fail-closed dominate weaker caution actions", () => {
    const result = buildGovernanceAwareCautionBridge(buildInput({
      confidenceClassification: "very_low",
      replayValidationState: "UNSTABLE",
      governanceBindingState: "DISPUTED",
      authorityAmbiguous: true,
      lineageIntegrityState: "MISMATCHED",
    }));

    expect(result.requiredAction).toBe("FAIL_CLOSED");
    expect(result.failClosed).toBe(true);
    expect(result.reasonCodes).toEqual([
      "AUTHORITY_AMBIGUITY",
      "CONFIDENCE_COLLAPSE",
      "GOVERNANCE_CONFLICT",
      "LINEAGE_MISMATCH",
      "REPLAY_INSTABILITY",
    ]);
  });
});
