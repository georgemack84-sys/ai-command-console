import { describe, expect, it } from "vitest";

import { exportRecoveryEvidence } from "../../services/recovery/recoveryEvidenceExporter.ts";

function createBundle(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_1",
    readModel: {
      executionId: "exec_1",
      execution: { status: "running" },
      recovery: { status: "none", attemptsCount: 0 },
      recoveryControl: { status: "none", requiresApproval: false },
      advisory: { status: "none", requiresOperator: false, advisoryOnly: true },
      automation: { status: "none", automationAllowed: false },
      autonomy: { status: "none", autonomyAllowed: false },
      verification: { status: "not_run" },
      learning: {
        status: "not_run",
        recommendationCount: 0,
        hasPolicyRecommendations: false,
        hasWarnings: false,
        advisoryOnly: true,
      },
      lock: { isLocked: false, stale: false },
      ledger: { totalEvents: 0 },
      risk: {
        hasFailure: false,
        hasVerificationFailure: false,
        hasStaleLock: false,
        hasOpenAdvisory: false,
        hasUnsafeUnknown: false,
        hasLearningWarnings: false,
        requiresOperatorAttention: false,
      },
      meta: { completeness: "complete", warnings: [] },
    },
    timeline: {
      executionId: "exec_1",
      events: [],
      meta: {
        totalEvents: 0,
        timeRange: {},
        completeness: "complete",
        warnings: [],
        matchesReadModel: true,
      },
    },
    state: "normal",
    sections: {
      execution: {},
      recovery: {},
      control: {},
      advisory: {},
      automation: {},
      autonomy: {},
      verification: {},
      learning: {},
      lock: {},
      ledger: {},
    },
    integrity: {
      hash: "hash_1",
      algorithm: "sha256",
      matchesReadModel: true,
    },
    meta: {
      completeness: "complete",
      warnings: [],
      version: "3.5D-2",
    },
    ...overrides,
  };
}

describe("recovery evidence exporter", () => {
  it("JSON export correct", () => {
    const bundle = createBundle();
    const result = exportRecoveryEvidence(bundle as any, "json");
    expect(result).toEqual({ ok: true, data: bundle });
  });

  it("markdown export includes warning section", () => {
    const bundle = createBundle({
      state: "disputed",
      integrity: {
        hash: "hash_1",
        algorithm: "sha256",
        matchesReadModel: false,
      },
      meta: {
        completeness: "partial",
        warnings: ["Timeline does not explain current state"],
        version: "3.5D-2",
      },
    });
    const result = exportRecoveryEvidence(bundle as any, "markdown");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toContain("# Recovery Evidence Report");
    expect(result.data).toContain("## ⚠️ Consistency Warning");
    expect(result.data).toContain("Timeline does not fully explain current system state. Evidence should be reviewed before taking action.");
  });

  it("export still succeeds in disputed state", () => {
    const bundle = createBundle({
      state: "disputed",
      integrity: { hash: "hash_1", algorithm: "sha256", matchesReadModel: false },
    });
    const result = exportRecoveryEvidence(bundle as any, "markdown");
    expect(result.ok).toBe(true);
  });
});

