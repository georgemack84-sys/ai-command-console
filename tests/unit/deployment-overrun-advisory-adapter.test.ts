import { describe, expect, it } from "vitest";

import {
  adaptDeploymentOverrunToAdvisory,
  evaluateDeploymentOverrun,
} from "../../services/deployment-overrun/index.ts";
import { adaptOperationalRulesToAdvisory, evaluateOperationalRules } from "../../services/operational-rules/index.ts";

const startedAt = "2026-05-29T00:00:00.000Z";

function minutesAfter(minutes: number) {
  return new Date(Date.parse(startedAt) + minutes * 60_000).toISOString();
}

const baseSnapshot = Object.freeze({
  workflowId: "deploy",
  workflowName: "Deploy",
  runId: "run-456",
  commitSha: "abc123",
  startedAt,
  updatedAt: minutesAfter(40),
  observedAt: minutesAfter(40),
  lastProgressAt: minutesAfter(39),
  heartbeatAt: minutesAfter(39),
  activeJob: "package",
  activeStep: "Build standalone bundle",
  releaseGatePassed: true,
  approvalLineage: Object.freeze(["approval:release-governance"]),
  logs: Object.freeze([
    Object.freeze({ at: minutesAfter(1), message: "deployment started" }),
    Object.freeze({ at: minutesAfter(39), message: "build progressing" }),
  ]),
  artifacts: Object.freeze([
    Object.freeze({ name: "ai-command-console-release.tgz", hash: "sha256:artifact" }),
  ]),
  smokeResults: Object.freeze({ status: "pending" }),
  certification: Object.freeze({
    certificateHash: "sha256:certificate",
    releaseId: "phase-3.7",
    governanceStatus: "PASSED" as const,
    residueResult: "CLEAN" as const,
    artifactHash: "sha256:artifact",
    commitSha: "abc123",
  }),
  replay: Object.freeze({
    runtimeHash: "sha256:runtime",
    replayHash: "sha256:runtime",
    replayBundlePresent: true,
  }),
});

function evaluationFrom(overrides: Record<string, unknown> = {}) {
  return evaluateDeploymentOverrun({
    ...baseSnapshot,
    ...overrides,
  });
}

function advisoryFrom(overrides: Record<string, unknown> = {}) {
  return adaptDeploymentOverrunToAdvisory({
    evaluation: evaluationFrom(overrides),
    evidenceRefs: ["deployment-overrun:evaluation"],
  });
}

describe("deployment overrun advisory adapter", () => {
  it("removes cancel authority from advisory output", () => {
    const result = adaptDeploymentOverrunToAdvisory({
      evaluation: {
        ...evaluationFrom({
          operatorAction: "CANCEL",
          observedAt: minutesAfter(110),
          updatedAt: minutesAfter(70),
          lastProgressAt: minutesAfter(70),
          heartbeatAt: minutesAfter(109),
        }),
        operatorActions: {
          retryAllowed: false,
          newDeployAllowed: false,
          cancelAllowed: true,
          forcePushAutomationAllowed: false,
        },
      },
      evidenceRefs: ["deployment-overrun:cancel"],
    });
    const serialized = JSON.stringify(result);

    expect(result.mayCancel).toBe(false);
    expect(result.advisoryReasons).toContain("CANCEL_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
    expect(serialized).not.toContain("cancelAllowed");
  });

  it("removes retry rollback redeploy and resume authority-shaped outputs", () => {
    const result = adaptDeploymentOverrunToAdvisory({
      evaluation: {
        ...evaluationFrom(),
        operatorActions: {
          retryAllowed: true,
          newDeployAllowed: true,
          cancelAllowed: false,
          forcePushAutomationAllowed: true,
        },
        rollbackAllowed: true,
        resumeAllowed: true,
      },
      evidenceRefs: ["deployment-overrun:operator-policy"],
    });
    const serialized = JSON.stringify(result);

    expect(result.mayRetry).toBe(false);
    expect(result.mayDeploy).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.advisoryReasons).toContain("RETRY_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
    expect(result.advisoryReasons).toContain("REDEPLOY_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
    expect(result.advisoryReasons).toContain("ROLLBACK_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
    expect(result.advisoryReasons).toContain("RESUME_RECOMMENDATION_NORMALIZED_TO_ADVISORY");
    expect(serialized).not.toContain("retryAllowed");
    expect(serialized).not.toContain("newDeployAllowed");
    expect(serialized).not.toContain("rollbackAllowed");
    expect(serialized).not.toContain("resumeAllowed");
  });

  it("produces deterministic advisory outputs and hashes", () => {
    const first = adaptDeploymentOverrunToAdvisory({
      evaluation: evaluationFrom(),
      evidenceRefs: ["b", "a", "a"],
    });
    const second = adaptDeploymentOverrunToAdvisory({
      evaluation: evaluationFrom(),
      evidenceRefs: ["a", "b"],
    });

    expect(first).toEqual(second);
    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(first.advisoryHash).toBe(second.advisoryHash);
  });

  it("escalates heartbeat gaps as advisory-only", () => {
    const result = advisoryFrom({
      heartbeatAt: undefined,
    });

    expect(result.advisoryStatus).toBe("ESCALATE");
    expect(result.risk).toBe("HIGH");
    expect(result.advisoryReasons).toContain("HEARTBEAT_GAP_REQUIRES_OPERATOR_REVIEW");
    expect(result.mayCancel).toBe(false);
  });

  it("keeps duplicate deploy detection advisory-only", () => {
    const result = advisoryFrom({
      operatorAction: "START_DEPLOY",
      activeDeployment: {
        runId: "run-active",
        state: "RUNNING",
      },
    });

    expect(result.advisoryStatus).toBe("ESCALATE");
    expect(result.risk).toBe("CRITICAL");
    expect(result.advisoryReasons).toContain("DUPLICATE_DEPLOYMENT_ATTEMPT");
    expect(result.mayDeploy).toBe(false);
  });

  it("keeps release gate bypass detection advisory-only", () => {
    const result = advisoryFrom({
      operatorAction: "START_DEPLOY",
      releaseGatePassed: false,
    });

    expect(result.advisoryStatus).toBe("ESCALATE");
    expect(result.risk).toBe("CRITICAL");
    expect(result.advisoryReasons).toContain("RELEASE_GATE_NOT_PASSED");
    expect(result.mayDeploy).toBe(false);
  });

  it("fails when critical evidence is missing", () => {
    const result = adaptDeploymentOverrunToAdvisory({
      evaluation: {
        ...evaluationFrom(),
        evidence: {
          ...evaluationFrom().evidence,
          evidenceHash: "",
        },
      },
      evidenceRefs: [],
    });

    expect(result.advisoryStatus).toBe("FAILED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.replayable).toBe(false);
    expect(result.advisoryReasons).toContain("DEPLOYMENT_OVERRUN_EVIDENCE_MISSING");
  });

  it("disputes conflicting evidence and hash mismatches", () => {
    const result = adaptDeploymentOverrunToAdvisory({
      evaluation: evaluationFrom({
        replay: {
          runtimeHash: "sha256:runtime",
          replayHash: "sha256:replay",
          replayBundlePresent: true,
        },
      }),
      expectedEvidenceHash: "sha256:forged",
      evidenceRefs: ["deployment-overrun:evaluation"],
    });

    expect(result.advisoryStatus).toBe("DISPUTED");
    expect(result.risk).toBe("UNKNOWN");
    expect(result.advisoryReasons).toContain("DEPLOYMENT_OVERRUN_EVIDENCE_HASH_MISMATCH");
  });

  it("preserves operational-rules integration as advisory-only", () => {
    const operationalRules = adaptOperationalRulesToAdvisory({
      evaluation: evaluateOperationalRules({
        workflowId: "workflow:overrun",
        actor: "release-governance",
        enforcementPoint: "Deployment",
        stateBefore: "WAITING",
        stateAfter: "PASSED",
        timestamp: startedAt,
        deployRequested: true,
        releaseGatePassed: true,
        replay: {
          runtimeHash: "sha256:runtime",
          replayHash: "sha256:runtime",
          replayBundlePresent: true,
        },
      }),
      evidenceRefs: ["operational-rules:evaluation"],
    });

    const result = adaptDeploymentOverrunToAdvisory({
      evaluation: evaluationFrom(),
      operationalRules,
      evidenceRefs: ["deployment-overrun:evaluation"],
    });

    expect(result.authority).toBe("ADVISORY_ONLY");
    expect(result.advisoryReasons).toContain("OPERATIONAL_RULES_ADVISORY_REF:SAFE");
    expect(result.mayDeploy).toBe(false);
  });

  it("is replayable and introduces no workflow mutation", () => {
    const result = advisoryFrom();

    expect(result.replayable).toBe(true);
    expect(result.authority).toBe("ADVISORY_ONLY");
    expect(result.requiresExplicitEnforcementPhase).toBe(true);
    expect(result.mayCancel).toBe(false);
    expect(result.mayRetry).toBe(false);
    expect(result.mayRollback).toBe(false);
    expect(result.mayResume).toBe(false);
    expect(result.mayDeploy).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
  });
});
