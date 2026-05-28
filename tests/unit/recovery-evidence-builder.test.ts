import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedReadModel = vi.hoisted(() => ({
  buildRecoveryReadModel: vi.fn(),
}));

const mockedTimeline = vi.hoisted(() => ({
  buildRecoveryTimeline: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModel.ts", () => mockedReadModel);
vi.mock("../../services/recovery/recoveryTimelineBuilder.ts", () => mockedTimeline);
vi.mock("../../services/recoveryCommitter.js", () => ({
  commitRecoveryPlan: () => {
    throw new Error("3.5D must not call D-6 commit");
  },
}));
vi.mock("../../services/recoveryController.js", () => ({
  approveRecovery: () => {
    throw new Error("3.5D must not call D-7 approve");
  },
  commitRecovery: () => {
    throw new Error("3.5D must not call D-7 commit");
  },
}));
vi.mock("../../services/recoveryCandidateScanner.js", () => ({
  scanRecoveryCandidates: () => {
    throw new Error("3.5D must not call D-8 scanner");
  },
}));
vi.mock("../../services/recoveryLearningRunner.js", () => ({
  runRecoveryLearningPass: () => {
    throw new Error("3.5D must not call D-13 runner");
  },
}));

import { buildRecoveryEvidenceBundle } from "../../services/recovery/recoveryEvidenceBuilder.ts";

function createReadModel(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_1",
    execution: { status: "running", startedAt: 1700000000000 },
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
    meta: { completeness: "complete", warnings: [], updatedAt: 1700000000000 },
    ...overrides,
  };
}

function createTimeline(overrides: Record<string, any> = {}) {
  return {
    executionId: "exec_1",
    events: [],
    meta: {
      totalEvents: 0,
      timeRange: {},
      completeness: "complete",
      warnings: [],
      matchesReadModel: true,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadModel.buildRecoveryReadModel.mockResolvedValue({ ok: true, data: createReadModel() });
  mockedTimeline.buildRecoveryTimeline.mockResolvedValue({ ok: true, data: createTimeline() });
});

describe("recovery evidence builder", () => {
  it("bundle builds in normal state", async () => {
    const result = await buildRecoveryEvidenceBundle({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.state).toBe("normal");
    expect(result.data.integrity.matchesReadModel).toBe(true);
    expect(result.data.meta.version).toBe("3.5D-2");
  });

  it("bundle builds in disputed state", async () => {
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: createTimeline({
        meta: {
          totalEvents: 0,
          timeRange: {},
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    const result = await buildRecoveryEvidenceBundle({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.state).toBe("disputed");
    expect(result.data.integrity.matchesReadModel).toBe(false);
    expect(result.data.meta.completeness).toBe("partial");
  });

  it("disputed state includes warnings", async () => {
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: createTimeline({
        meta: {
          totalEvents: 0,
          timeRange: {},
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    const result = await buildRecoveryEvidenceBundle({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.warnings).toEqual(
      expect.arrayContaining([
        "Timeline does not explain current state",
        "Operator actions may be restricted",
      ]),
    );
  });

  it("no mutation occurs", async () => {
    const fakeDb = { run: vi.fn(), exec: vi.fn() };
    const result = await buildRecoveryEvidenceBundle({ db: fakeDb, executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
    expect(fakeDb.run).not.toHaveBeenCalled();
    expect(fakeDb.exec).not.toHaveBeenCalled();
  });

  it("unsafe input fails closed", async () => {
    const result = await buildRecoveryEvidenceBundle({ executionId: "" as any, nowMs: 1700000000000 });
    expect(result).toEqual({
      ok: false,
      error: "BLOCKED_UNSAFE_EVIDENCE_EXPORT",
    });
  });
});

