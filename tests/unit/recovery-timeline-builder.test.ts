import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedReadModel = vi.hoisted(() => ({
  buildRecoveryReadModel: vi.fn(),
}));

const mockedStore = vi.hoisted(() => ({
  getExecutionEvents: vi.fn(),
  getLockEvents: vi.fn(),
  getLedgerEvents: vi.fn(),
  getRecoveryEvents: vi.fn(),
  getControlEvents: vi.fn(),
  getAdvisoryEvents: vi.fn(),
  getAutomationEvents: vi.fn(),
  getAutonomyEvents: vi.fn(),
  getVerificationEvents: vi.fn(),
  getLearningEvents: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModel.ts", () => mockedReadModel);
vi.mock("../../services/recovery/recoveryTimelineStore.ts", () => mockedStore);
vi.mock("../../services/recoveryCommitter.js", () => ({
  commitRecoveryPlan: () => {
    throw new Error("3.5B must not call D-6 commit");
  },
}));
vi.mock("../../services/recoveryController.js", () => ({
  approveRecovery: () => {
    throw new Error("3.5B must not call D-7 approve");
  },
  commitRecovery: () => {
    throw new Error("3.5B must not call D-7 commit");
  },
}));
vi.mock("../../services/recoveryCandidateScanner.js", () => ({
  scanRecoveryCandidates: () => {
    throw new Error("3.5B must not call D-8 scanner");
  },
}));
vi.mock("../../services/recoveryLearningRunner.js", () => ({
  runRecoveryLearningPass: () => {
    throw new Error("3.5B must not call D-13 runner");
  },
}));

import { buildRecoveryTimeline } from "../../services/recovery/recoveryTimelineBuilder.ts";

function baseReadModel() {
  return {
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
  };
}

function baseStoreMocks() {
  mockedStore.getExecutionEvents.mockReturnValue([]);
  mockedStore.getLockEvents.mockReturnValue([]);
  mockedStore.getLedgerEvents.mockReturnValue([]);
  mockedStore.getRecoveryEvents.mockReturnValue([]);
  mockedStore.getControlEvents.mockReturnValue([]);
  mockedStore.getAdvisoryEvents.mockReturnValue([]);
  mockedStore.getAutomationEvents.mockReturnValue([]);
  mockedStore.getAutonomyEvents.mockReturnValue([]);
  mockedStore.getVerificationEvents.mockReturnValue([]);
  mockedStore.getLearningEvents.mockReturnValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
    ok: true,
    data: baseReadModel(),
  });
  baseStoreMocks();
});

describe("recovery timeline builder", () => {
  it("timeline builds empty", async () => {
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events).toEqual([]);
  });

  it("timeline builds from execution only", async () => {
    mockedStore.getExecutionEvents.mockReturnValue([
      { id: "event_1", createdAt: 1700000000000, eventType: "execution.started", payload: {} },
    ]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events[0].type).toBe("execution_started");
  });

  it("recovery events mapped correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        recovery: { status: "completed", attemptsCount: 1, latestAttemptId: "11" },
      },
    });
    mockedStore.getRecoveryEvents.mockReturnValue([{ id: 11, status: "completed", createdAt: 1700000000000, completedAt: 1700000001000 }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.some((event) => event.type === "recovery_attempt_completed")).toBe(true);
  });

  it("advisory events mapped correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        advisory: { status: "escalated", requiresOperator: true, advisoryOnly: true },
      },
    });
    mockedStore.getAdvisoryEvents.mockReturnValue([{ id: "audit_1", timestamp: "2026-05-03T00:00:00.000Z", type: "RECOVERY_ADVISORY_ESCALATED", payload: { advisoryId: "adv_1" } }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.some((event) => event.type === "advisory_escalated")).toBe(true);
  });

  it("verification events mapped correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        verification: { status: "passed" },
      },
    });
    mockedStore.getVerificationEvents.mockReturnValue([{ id: "ver_1", timestamp: "2026-05-03T00:00:00.000Z", payload: { verification: { outcome: "VERIFIED" } } }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.some((event) => event.type === "verification_passed")).toBe(true);
  });

  it("learning events mapped correctly", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        learning: { status: "report_available", recommendationCount: 1, hasPolicyRecommendations: true, hasWarnings: false, advisoryOnly: true },
      },
    });
    mockedStore.getLearningEvents.mockReturnValue([{ id: "learn_1", timestamp: "2026-05-03T00:00:00.000Z", type: "RECOVERY_LEARNING_REPORT_CREATED", payload: { report: { recommendations: [{}] } } }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.some((event) => event.type === "learning_report_created")).toBe(true);
  });

  it("sorting deterministic", async () => {
    mockedStore.getExecutionEvents.mockReturnValue([
      { id: "b", createdAt: 1700000001000, eventType: "execution.started", payload: {} },
      { id: "a", createdAt: 1700000001000, eventType: "execution.started", payload: {} },
    ]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.map((event) => event.eventId)).toEqual(["a", "b"]);
  });

  it("duplicate timestamps handled", async () => {
    mockedStore.getLedgerEvents.mockReturnValue([
      { id: 2, createdAt: 1700000000000, eventType: "attempt.completed", eventPayload: {} },
      { id: 1, createdAt: 1700000000000, eventType: "attempt.started", eventPayload: {} },
    ]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.events.length).toBe(2);
  });

  it("missing data produces warnings", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        execution: { status: "unknown" },
        meta: { completeness: "partial", warnings: ["MISSING_EXECUTION"] },
      },
    });
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.warnings).toContain("MISSING_EXECUTION");
  });

  it("no mutation occurs", async () => {
    const fakeDb = { run: vi.fn(), exec: vi.fn() };
    const result = await buildRecoveryTimeline({ db: fakeDb, executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
    expect(fakeDb.run).not.toHaveBeenCalled();
    expect(fakeDb.exec).not.toHaveBeenCalled();
  });

  it("timeline matches 3.5A read model", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        recovery: { status: "completed", attemptsCount: 1, latestAttemptId: "11" },
      },
    });
    mockedStore.getRecoveryEvents.mockReturnValue([{ id: 11, status: "completed", createdAt: 1700000000000, completedAt: 1700000001000 }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.matchesReadModel).toBe(true);
  });

  it("mismatch sets matchesReadModel = false", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        verification: { status: "passed" },
      },
    });
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.matchesReadModel).toBe(false);
    expect(result.ok && result.data.meta.warnings).toContain("TIMELINE_STATE_MISMATCH");
  });

  it("timeline does not contradict read model", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: {
        ...baseReadModel(),
        advisory: { status: "open", requiresOperator: true, advisoryOnly: true },
      },
    });
    mockedStore.getAdvisoryEvents.mockReturnValue([{ id: "audit_1", timestamp: "2026-05-03T00:00:00.000Z", type: "RECOVERY_ADVISORY_CREATED", payload: { advisoryId: "adv_1" } }]);
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.matchesReadModel).toBe(true);
  });

  it("unsafe input returns BLOCKED_UNSAFE_RECOVERY_TIMELINE", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: false,
      error: "BLOCKED_UNSAFE_RECOVERY_READ_MODEL",
    });
    const result = await buildRecoveryTimeline({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result).toEqual({
      ok: false,
      error: "BLOCKED_UNSAFE_RECOVERY_TIMELINE",
    });
  });
});
