import { describe, expect, it } from "vitest";

import {
  evaluateOperationalRules,
  getEnabledOperationalRules,
} from "../../services/operational-rules/index.ts";

const baseInput = Object.freeze({
  workflowId: "workflow:phase-3.7-workstream-f",
  actor: "release-governance",
  enforcementPoint: "Deployment" as const,
  stateBefore: "WAITING" as const,
  stateAfter: "PASSED" as const,
  timestamp: "2026-05-28T00:00:00.000Z",
  deployRequested: false,
  retryRequested: false,
  releaseGatePassed: true,
  replay: Object.freeze({
    runtimeHash: "sha256:runtime",
    replayHash: "sha256:runtime",
    replayBundlePresent: true,
  }),
  mutation: Object.freeze({
    attempted: false,
    visible: true,
    reason: "no mutation",
  }),
});

describe("operational rules", () => {
  it("registers the always-active constitutional operating rules", () => {
    const rules = getEnabledOperationalRules();

    expect(rules.map((rule) => rule.id)).toEqual([
      "UNKNOWN_UNSAFE",
      "DISPUTED_NON_DEPLOYABLE",
      "RETRY_REQUIRES_CLASSIFICATION",
      "RELEASE_GATE_REQUIRED",
      "NO_HIDDEN_STATE_MUTATION",
      "REPLAY_REMAINS_AUTHORITATIVE",
    ]);
    expect(rules.every((rule) => rule.enabled)).toBe(true);
    expect(rules.every((rule) => rule.severity === "CRITICAL")).toBe(true);
  });

  it("maps UNKNOWN state to DISPUTED and blocks progression", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      stateBefore: "UNKNOWN",
      stateAfter: "RUNNING",
      enforcementPoint: "Preflight",
    });

    expect(result.ok).toBe(false);
    expect(result.authorityState).toBe("DISPUTED");
    expect(result.violations.map((violation) => violation.ruleId)).toContain("UNKNOWN_UNSAFE");
  });

  it("denies deployment from disputed state", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      deployRequested: true,
      stateBefore: "DISPUTED",
      stateAfter: "PASSED",
    });

    expect(result.ok).toBe(false);
    expect(result.deployable).toBe(false);
    expect(result.violations.map((violation) => violation.ruleId)).toContain("DISPUTED_NON_DEPLOYABLE");
  });

  it("rejects retries without failure classification", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      enforcementPoint: "Retry Logic",
      retryRequested: true,
    });

    expect(result.ok).toBe(false);
    expect(result.retryAllowed).toBe(false);
    expect(result.violations.map((violation) => violation.ruleId)).toContain("RETRY_REQUIRES_CLASSIFICATION");
  });

  it("rejects UNKNOWN_FAILURE retry classification as unsafe", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      enforcementPoint: "Retry Logic",
      retryRequested: true,
      failureClassification: "UNKNOWN_FAILURE",
    });

    expect(result.ok).toBe(false);
    expect(result.retryAllowed).toBe(false);
    expect(result.authorityState).toBe("DISPUTED");
  });

  it("treats runtime and replay disagreement as disputed authority", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      enforcementPoint: "Replay",
      replay: {
        runtimeHash: "sha256:runtime",
        replayHash: "sha256:replay",
        replayBundlePresent: true,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.authorityState).toBe("DISPUTED");
    expect(result.violations.map((violation) => violation.ruleId)).toContain("REPLAY_REMAINS_AUTHORITATIVE");
  });

  it("blocks release gate bypass attempts", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      deployRequested: true,
      releaseGatePassed: false,
    });

    expect(result.ok).toBe(false);
    expect(result.deployable).toBe(false);
    expect(result.violations.map((violation) => violation.ruleId)).toContain("RELEASE_GATE_REQUIRED");
  });

  it("detects hidden state mutation attempts", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      enforcementPoint: "Execution",
      mutation: {
        attempted: true,
        visible: false,
        reason: "background write",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      expect.objectContaining({
        ruleId: "NO_HIDDEN_STATE_MUTATION",
        workflowId: baseInput.workflowId,
        actor: baseInput.actor,
        stateBefore: baseInput.stateBefore,
        stateAfter: baseInput.stateAfter,
      }),
    ]);
    expect(result.violations[0]?.evidenceHash).toMatch(/^sha256:/);
  });

  it("contains disputed recovery attempts without classification", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      enforcementPoint: "Recovery",
      recoveryRequested: true,
      stateBefore: "DISPUTED",
      stateAfter: "RUNNING",
    });

    expect(result.ok).toBe(false);
    expect(result.authorityState).toBe("DISPUTED");
    expect(result.violations.map((violation) => violation.ruleId)).toContain("DISPUTED_NON_DEPLOYABLE");
  });

  it("produces deterministic evidence and violation hashes", () => {
    const first = evaluateOperationalRules({
      ...baseInput,
      deployRequested: true,
      releaseGatePassed: false,
    });
    const second = evaluateOperationalRules({
      ...baseInput,
      deployRequested: true,
      releaseGatePassed: false,
    });

    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(first.violations[0]?.violationId).toBe(second.violations[0]?.violationId);
    expect(first.violations[0]?.evidenceHash).toBe(second.violations[0]?.evidenceHash);
  });

  it("allows deployment only when release gates, replay, residue, and state are safe", () => {
    const result = evaluateOperationalRules({
      ...baseInput,
      deployRequested: true,
      stateBefore: "WAITING",
      stateAfter: "PASSED",
      releaseGatePassed: true,
    });

    expect(result.ok).toBe(true);
    expect(result.deployable).toBe(true);
    expect(result.retryAllowed).toBe(false);
    expect(result.authorityState).toBe("PASSED");
    expect(result.violations).toEqual([]);
  });
});
