import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedStore = vi.hoisted(() => ({
  getExecution: vi.fn(),
  getLock: vi.fn(),
  getLedgerEvents: vi.fn(),
  getRecoveryAttempts: vi.fn(),
  getRecoveryControlRequests: vi.fn(),
  getRecoveryAdvisories: vi.fn(),
  getAutomationState: vi.fn(),
  getAutonomyState: vi.fn(),
  getVerificationResults: vi.fn(),
  getLearningReports: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModelStore.ts", () => mockedStore);
vi.mock("../../services/recoveryCommitter.js", () => ({
  commitRecoveryPlan: () => {
    throw new Error("3.5A must not call D-6 commit");
  },
}));
vi.mock("../../services/recoveryController.js", () => ({
  requestRecovery: () => {
    throw new Error("3.5A must not call D-7 request");
  },
  approveRecovery: () => {
    throw new Error("3.5A must not call D-7 approve");
  },
  commitRecovery: () => {
    throw new Error("3.5A must not call D-7 commit");
  },
}));
vi.mock("../../services/recoveryCandidateScanner.js", () => ({
  scanRecoveryCandidates: () => {
    throw new Error("3.5A must not call D-8 scanner");
  },
}));
vi.mock("../../services/recoverySignalClassifier.js", () => ({
  classifyRecoverySignal: () => {
    throw new Error("3.5A must not call D-8 classifier");
  },
}));
vi.mock("../../services/recoveryRecommendationEngine.js", () => ({
  recommendRecoveryAction: () => {
    throw new Error("3.5A must not call D-8 recommender");
  },
}));
vi.mock("../../services/recoveryLearningRunner.js", () => ({
  runRecoveryLearningPass: () => {
    throw new Error("3.5A must not call D-13 runner");
  },
}));
vi.mock("../../services/recoveryLearningPolicyAdvisor.js", () => ({
  recommendRecoveryPolicyAdjustments: () => {
    throw new Error("3.5A must not call D-13 advisor");
  },
}));

import { buildRecoveryReadModel } from "../../services/recovery/recoveryReadModel.ts";

function createExecution(status = "running") {
  return {
    execution: {
      id: "exec_1",
      planId: "plan_1",
      status,
      startedAt: "2026-05-03T00:00:00.000Z",
      finishedAt: status === "completed" ? "2026-05-03T00:10:00.000Z" : null,
      leaseOwner: null,
      leaseExpiresAt: null,
      lastUpdatedAt: "2026-05-03T00:10:00.000Z",
    },
    steps: [],
    stages: [],
    pendingReviews: [],
    auditTimeline: [],
  };
}

function createBaseMocks() {
  mockedStore.getExecution.mockReturnValue(createExecution());
  mockedStore.getLock.mockReturnValue(null);
  mockedStore.getLedgerEvents.mockReturnValue([{ id: 1, eventType: "execution.started", createdAt: 1700000000000 }]);
  mockedStore.getRecoveryAttempts.mockReturnValue([]);
  mockedStore.getRecoveryControlRequests.mockReturnValue([]);
  mockedStore.getRecoveryAdvisories.mockReturnValue([]);
  mockedStore.getAutomationState.mockReturnValue([]);
  mockedStore.getAutonomyState.mockReturnValue([]);
  mockedStore.getVerificationResults.mockReturnValue([]);
  mockedStore.getLearningReports.mockReturnValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  createBaseMocks();
});

describe("recovery read model", () => {
  it("no recovery attempts returns recovery.status = none", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.recovery.status).toBe("none");
  });

  it("completed recovery returns recovery.status = completed", async () => {
    mockedStore.getRecoveryAttempts.mockReturnValue([{ id: 11, status: "completed", updatedAt: 1700000001000 }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.recovery.status).toBe("completed");
  });

  it("failed recovery returns recovery.status = failed", async () => {
    mockedStore.getRecoveryAttempts.mockReturnValue([{ id: 11, status: "failed", updatedAt: 1700000001000 }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.recovery.status).toBe("failed");
  });

  it("D-7 request state appears in recoveryControl", async () => {
    mockedStore.getRecoveryControlRequests.mockReturnValue([{ recoveryRequestId: "recovery_1", status: "REQUESTED", auditEvents: [{ timestamp: "2026-05-03T00:00:00.000Z" }] }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.recoveryControl.status).toBe("requested");
  });

  it("approval_required sets requiresApproval = true", async () => {
    mockedStore.getRecoveryControlRequests.mockReturnValue([{ recoveryRequestId: "recovery_1", status: "AWAITING_APPROVAL", auditEvents: [{ timestamp: "2026-05-03T00:00:00.000Z" }] }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.recoveryControl.requiresApproval).toBe(true);
  });

  it("no advisory returns advisory.status = none", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.status).toBe("none");
  });

  it("open advisory returns advisory.status = open", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "OPEN", latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.status).toBe("open");
  });

  it("dismissed advisory returns advisory.status = dismissed", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "DISMISSED", latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.status).toBe("dismissed");
  });

  it("escalated advisory returns advisory.status = escalated", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "ESCALATED", latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.status).toBe("escalated");
  });

  it("request_created advisory returns advisory.status = request_created", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "REQUEST_CREATED", latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.status).toBe("request_created");
  });

  it("UNKNOWN advisory signal recommends none", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "OPEN", signal: { signalType: "UNKNOWN" }, recommendation: { recommendation: "resume" }, latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.recommendation).toBe("none");
  });

  it("UNKNOWN advisory signal sets hasUnsafeUnknown = true", async () => {
    mockedStore.getRecoveryAdvisories.mockReturnValue([{ advisoryId: "adv_1", state: "OPEN", signal: { signalType: "UNKNOWN" }, latestTimestamp: "2026-05-03T00:00:00.000Z" }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.risk.hasUnsafeUnknown).toBe(true);
  });

  it("advisory.advisoryOnly is always true", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.advisory.advisoryOnly).toBe(true);
  });

  it("automation allowed state is read but not executed", async () => {
    mockedStore.getAutomationState.mockReturnValue([{ id: "auto_1", type: "RECOVERY_AUTOMATION_POLICY_EVALUATED", timestamp: "2026-05-03T00:00:00.000Z", payload: { policy: { allowed: true, action: "create_request", reason: "safe" } } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.automation.status).toBe("eligible");
    expect(result.ok && result.data.automation.automationAllowed).toBe(true);
  });

  it("automation blocked state is reflected safely", async () => {
    mockedStore.getAutomationState.mockReturnValue([{ id: "auto_1", type: "RECOVERY_AUTOMATION_BLOCKED", timestamp: "2026-05-03T00:00:00.000Z", payload: { reason: "blocked" } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.automation.status).toBe("blocked");
  });

  it("autonomy requires_operator sets operator attention", async () => {
    mockedStore.getAutonomyState.mockReturnValue([{ id: "aut_1", type: "RECOVERY_AUTONOMY_POLICY_EVALUATED", timestamp: "2026-05-03T00:00:00.000Z", payload: { policy: { action: "manual_approval_required", reason: "review" } } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.autonomy.status).toBe("requires_operator");
    expect(result.ok && result.data.risk.requiresOperatorAttention).toBe(true);
  });

  it("verification passed returns verification.status = passed", async () => {
    mockedStore.getVerificationResults.mockReturnValue([{ id: "ver_1", timestamp: "2026-05-03T00:00:00.000Z", payload: { verification: { outcome: "VERIFIED" } } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.verification.status).toBe("passed");
  });

  it("verification failed sets hasVerificationFailure = true", async () => {
    mockedStore.getVerificationResults.mockReturnValue([{ id: "ver_1", timestamp: "2026-05-03T00:00:00.000Z", payload: { verification: { outcome: "FAILED" } } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.risk.hasVerificationFailure).toBe(true);
  });

  it("learning not run returns learning.status = not_run", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.learning.status).toBe("not_run");
  });

  it("learning report available returns learning.status = report_available", async () => {
    mockedStore.getLearningReports.mockReturnValue([{ id: "learn_report_1", type: "RECOVERY_LEARNING_REPORT_CREATED", timestamp: "2026-05-03T00:00:00.000Z", payload: { report: { recommendations: [{}] } } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.learning.status).toBe("report_available");
  });

  it("learning failed returns learning.status = failed", async () => {
    mockedStore.getLearningReports.mockReturnValue([{ id: "learn_fail_1", type: "RECOVERY_LEARNING_RUN_FAILED", timestamp: "2026-05-03T00:00:00.000Z", payload: { reason: "failed" } }]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.learning.status).toBe("failed");
  });

  it("learning warnings set hasLearningWarnings = true", async () => {
    mockedStore.getLearningReports.mockReturnValue([
      { id: "learn_signal_1", type: "RECOVERY_LEARNING_SIGNALS_AGGREGATED", timestamp: "2026-05-03T00:00:00.000Z", payload: { signals: { totals: { unknown: 1 }, warnings: ["missing"] } } },
      { id: "learn_report_1", type: "RECOVERY_LEARNING_REPORT_CREATED", timestamp: "2026-05-03T00:01:00.000Z", payload: { report: { recommendations: [] } } },
    ]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.learning.hasWarnings).toBe(true);
    expect(result.ok && result.data.risk.hasLearningWarnings).toBe(true);
  });

  it("learning.advisoryOnly is always true", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.learning.advisoryOnly).toBe(true);
  });

  it("stale lock sets hasStaleLock = true", async () => {
    mockedStore.getLock.mockReturnValue({ workerId: "worker_1", leaseExpiresAt: 1000, heartbeatAt: 1000, lockReleasedAt: null });
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 40000 });
    expect(result.ok && result.data.lock.stale).toBe(true);
    expect(result.ok && result.data.risk.hasStaleLock).toBe(true);
  });

  it("missing execution creates partial output with warning", async () => {
    mockedStore.getExecution.mockReturnValue(null);
    mockedStore.getLedgerEvents.mockReturnValue([]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.execution.status).toBe("unknown");
    expect(result.ok && result.data.meta.completeness).toBe("partial");
    expect(result.ok && result.data.meta.warnings).toContain("MISSING_EXECUTION");
  });

  it("missing ledger creates partial output with warning", async () => {
    mockedStore.getLedgerEvents.mockReturnValue([]);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok && result.data.meta.warnings).toContain("MISSING_LEDGER");
  });

  it("output is deterministic for identical input", async () => {
    const first = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    const second = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(second).toEqual(first);
  });

  it("buildRecoveryReadModel never calls D-6 commit functions", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
  });

  it("buildRecoveryReadModel never calls D-7 request/approval/commit", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
  });

  it("buildRecoveryReadModel never calls D-8 scanner/classifier/recommender", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
  });

  it("buildRecoveryReadModel never calls D-13 runner/policy advisor", async () => {
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
  });

  it("no write queries are executed", async () => {
    const fakeDb = {
      run: vi.fn(),
      exec: vi.fn(),
      prepare: vi.fn(),
    };
    const result = await buildRecoveryReadModel({ db: fakeDb, executionId: "exec_1", nowMs: 1700000000000 });
    expect(result.ok).toBe(true);
    expect(fakeDb.run).not.toHaveBeenCalled();
    expect(fakeDb.exec).not.toHaveBeenCalled();
  });

  it("unsafe/corrupt input returns BLOCKED_UNSAFE_RECOVERY_READ_MODEL", async () => {
    mockedStore.getRecoveryAttempts.mockReturnValue({ not: "an_array" } as any);
    const result = await buildRecoveryReadModel({ executionId: "exec_1", nowMs: 1700000000000 });
    expect(result).toEqual({
      ok: false,
      error: "BLOCKED_UNSAFE_RECOVERY_READ_MODEL",
      warnings: [],
    });
  });
});
