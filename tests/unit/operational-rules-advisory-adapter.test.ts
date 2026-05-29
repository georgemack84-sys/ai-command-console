import { describe, expect, it } from "vitest";

import {
  adaptOperationalRulesToAdvisory,
  evaluateOperationalRules,
} from "../../services/operational-rules/index.ts";

const baseInput = Object.freeze({
  workflowId: "workflow:operational-rules-advisory",
  actor: "release-governance",
  enforcementPoint: "Deployment" as const,
  stateBefore: "WAITING" as const,
  stateAfter: "PASSED" as const,
  timestamp: "2026-05-29T00:00:00.000Z",
  deployRequested: true,
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

function safeEvaluation() {
  return evaluateOperationalRules(baseInput);
}

function advisoryFrom(input: Parameters<typeof evaluateOperationalRules>[0]) {
  return adaptOperationalRulesToAdvisory({
    evaluation: evaluateOperationalRules(input),
    evidenceRefs: ["operational-rules:evaluation"],
  });
}

describe("operational rules advisory adapter", () => {
  it("removes deploy authority from advisory output", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: safeEvaluation(),
      evidenceRefs: ["operational-rules:evaluation"],
    });
    const serialized = JSON.stringify(result);

    expect(result.advisoryStatus).toBe("SAFE");
    expect(result.mayDeploy).toBe(false);
    expect(result.advisoryReasons).toContain("DEPLOY_AUTHORITY_NORMALIZED_TO_ADVISORY");
    expect(serialized).not.toContain("deployable");
  });

  it("removes retry authority from advisory output", () => {
    const evaluation = evaluateOperationalRules({
      ...baseInput,
      deployRequested: false,
      retryRequested: true,
      failureClassification: "INFRA_FAILURE",
    });
    const result = adaptOperationalRulesToAdvisory({
      evaluation,
      evidenceRefs: ["operational-rules:retry"],
    });
    const serialized = JSON.stringify(result);

    expect(result.mayRetry).toBe(false);
    expect(result.advisoryReasons).toContain("RETRY_AUTHORITY_NORMALIZED_TO_ADVISORY");
    expect(serialized).not.toContain("retryAllowed");
  });

  it("removes cancel rollback and resume authority-shaped fields", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: {
        ...safeEvaluation(),
        cancelAllowed: true,
        rollbackAllowed: true,
        resumeAllowed: true,
      },
      evidenceRefs: ["operational-rules:authority-shaped"],
    });
    const serialized = JSON.stringify(result);

    expect(result.mayCancel).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.advisoryReasons).toContain("CANCEL_AUTHORITY_NORMALIZED_TO_ADVISORY");
    expect(result.advisoryReasons).toContain("ROLLBACK_AUTHORITY_NORMALIZED_TO_ADVISORY");
    expect(result.advisoryReasons).toContain("RESUME_AUTHORITY_NORMALIZED_TO_ADVISORY");
    expect(serialized).not.toContain("cancelAllowed");
    expect(serialized).not.toContain("rollbackAllowed");
    expect(serialized).not.toContain("resumeAllowed");
  });

  it("produces deterministic advisory outputs and hashes", () => {
    const first = adaptOperationalRulesToAdvisory({
      evaluation: safeEvaluation(),
      evidenceRefs: ["b", "a", "a"],
    });
    const second = adaptOperationalRulesToAdvisory({
      evaluation: safeEvaluation(),
      evidenceRefs: ["a", "b"],
    });

    expect(first).toEqual(second);
    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(first.ruleHash).toBe(second.ruleHash);
  });

  it("fails closed on unknown authority state", () => {
    const result = advisoryFrom({
      ...baseInput,
      stateBefore: "UNKNOWN",
      stateAfter: "RUNNING",
    });

    expect(result.advisoryStatus).toBe("DISPUTED");
    expect(result.classification).toBe("GOVERNANCE");
    expect(result.advisoryReasons).toContain("UNKNOWN_STATE_FAIL_CLOSED");
  });

  it("escalates conflicting rule outputs", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: {
        ...safeEvaluation(),
        ok: true,
        deployable: true,
        authorityState: "PASSED",
        violations: [
          {
            violationId: "sha256:violation",
            ruleId: "RELEASE_GATE_REQUIRED",
            workflowId: baseInput.workflowId,
            actor: baseInput.actor,
            stateBefore: baseInput.stateBefore,
            stateAfter: baseInput.stateAfter,
            timestamp: baseInput.timestamp,
            evidenceHash: "sha256:violation-evidence",
          },
        ],
      },
      evidenceRefs: ["operational-rules:conflict"],
    });

    expect(result.advisoryStatus).toBe("ESCALATE");
    expect(result.classification).toBe("GOVERNANCE");
    expect(result.advisoryReasons).toContain("CONFLICTING_RULE_OUTPUT");
  });

  it("fails when required evidence is missing", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: {
        ...safeEvaluation(),
        evidenceHash: "",
      },
      evidenceRefs: [],
    });

    expect(result.advisoryStatus).toBe("FAILED");
    expect(result.replayable).toBe(false);
    expect(result.advisoryReasons).toContain("OPERATIONAL_RULE_EVIDENCE_MISSING");
  });

  it("disputes hash mismatches", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: safeEvaluation(),
      expectedEvidenceHash: "sha256:forged",
      evidenceRefs: ["operational-rules:evaluation"],
    });

    expect(result.advisoryStatus).toBe("DISPUTED");
    expect(result.advisoryReasons).toContain("OPERATIONAL_RULE_EVIDENCE_HASH_MISMATCH");
  });

  it("keeps advisory output replayable and non-mutating", () => {
    const result = adaptOperationalRulesToAdvisory({
      evaluation: safeEvaluation(),
      evidenceRefs: ["operational-rules:evaluation"],
    });

    expect(result.replayable).toBe(true);
    expect(result.authority).toBe("ADVISORY_ONLY");
    expect(result.requiresExplicitEnforcementPhase).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
