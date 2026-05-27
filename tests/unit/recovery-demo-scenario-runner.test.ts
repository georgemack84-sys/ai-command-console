import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedReadModel = vi.hoisted(() => ({
  buildRecoveryReadModel: vi.fn(),
}));

const mockedTimeline = vi.hoisted(() => ({
  buildRecoveryTimeline: vi.fn(),
}));

const mockedEvidence = vi.hoisted(() => ({
  buildRecoveryEvidenceBundle: vi.fn(),
}));

const mockedExporter = vi.hoisted(() => ({
  exportRecoveryEvidence: vi.fn(),
}));

const mockedOperatorController = vi.hoisted(() => ({
  getRecoveryOperatorView: vi.fn(),
}));

const mockedStateDatabase = vi.hoisted(() => ({
  withDatabase: vi.fn((work: (db: unknown) => unknown) =>
    work({
      prepare: vi.fn(() => ({ run: vi.fn() })),
      exec: vi.fn(),
      run: vi.fn(),
    })),
}));

const mockedExecutionStateStore = vi.hoisted(() => ({
  startExecutionState: vi.fn(),
  persistExecutionSnapshot: vi.fn(),
}));

const mockedExecutionIntegrityStore = vi.hoisted(() => ({
  appendLedgerEvent: vi.fn(),
  acquireExecutionLock: vi.fn(),
  createExecutionAttempt: vi.fn(() => ({ ok: true, data: { attemptNumber: 1 } })),
  completeExecutionAttempt: vi.fn(),
  failExecutionAttempt: vi.fn(),
}));

const mockedRecoveryAuditStore = vi.hoisted(() => ({
  recordRecoveryRequest: vi.fn(),
  recordPolicyDecision: vi.fn(),
  recordApproval: vi.fn(),
  recordCommitResult: vi.fn(),
}));

const mockedRecoveryAdvisoryStore = vi.hoisted(() => ({
  recordAdvisoryCreated: vi.fn(),
  recordAdvisoryRecommendation: vi.fn(),
  recordAdvisoryEscalated: vi.fn(),
  recordAdvisoryDismissed: vi.fn(),
  recordAdvisoryRequestCreated: vi.fn(),
}));

const mockedRecoveryAutomationStore = vi.hoisted(() => ({
  recordAutomationBlocked: vi.fn(),
  recordAutomationPolicyEvaluated: vi.fn(),
}));

const mockedRecoveryAutonomyStore = vi.hoisted(() => ({
  recordAutonomyPolicyEvaluated: vi.fn(),
  recordAutonomyAutoApprovalBlocked: vi.fn(),
}));

const mockedRecoveryVerificationStore = vi.hoisted(() => ({
  recordVerificationStarted: vi.fn(),
  recordVerificationResult: vi.fn(),
}));

const mockedRecoveryLearningStore = vi.hoisted(() => ({
  recordLearningSignalsAggregated: vi.fn(),
  recordLearningReportCreated: vi.fn(),
  recordLearningRunFailed: vi.fn(),
}));

vi.mock("../../services/recovery/recoveryReadModel.ts", () => mockedReadModel);
vi.mock("../../services/recovery/recoveryTimelineBuilder.ts", () => mockedTimeline);
vi.mock("../../services/recovery/recoveryEvidenceBuilder.ts", () => mockedEvidence);
vi.mock("../../services/recovery/recoveryEvidenceExporter.ts", () => mockedExporter);
vi.mock("../../controllers/recoveryOperatorController.ts", () => mockedOperatorController);
vi.mock("../../services/stateDatabase.js", () => mockedStateDatabase);
vi.mock("../../services/executionStateStore.js", () => mockedExecutionStateStore);
vi.mock("../../services/executionIntegrityStore.js", () => mockedExecutionIntegrityStore);
vi.mock("../../services/recoveryAuditStore.js", () => mockedRecoveryAuditStore);
vi.mock("../../services/recoveryAdvisoryStore.js", () => mockedRecoveryAdvisoryStore);
vi.mock("../../services/recoveryAutomationStore.js", () => mockedRecoveryAutomationStore);
vi.mock("../../services/recoveryAutonomyStore.js", () => mockedRecoveryAutonomyStore);
vi.mock("../../services/recoveryVerificationStore.js", () => mockedRecoveryVerificationStore);
vi.mock("../../services/recoveryLearningStore.js", () => mockedRecoveryLearningStore);
vi.mock("../../services/recoveryCommitter.js", () => ({
  commitRecoveryPlan: () => {
    throw new Error("3.5F must not call D-6 commit");
  },
}));
vi.mock("../../services/recoveryController.js", () => ({
  approveRecovery: () => {
    throw new Error("3.5F must not call D-7 approve");
  },
  commitRecovery: () => {
    throw new Error("3.5F must not call D-7 commit");
  },
}));
vi.mock("../../services/recoveryExecutionRunner.js", () => ({
  runApprovedRecoveryExecution: () => {
    throw new Error("3.5F must not call D-11 execution runner");
  },
}));
vi.mock("../../services/recoveryAutomationRunner.js", () => ({
  runRecoveryAutomationScan: () => {
    throw new Error("3.5F must not call D-9 automation runner");
  },
}));
vi.mock("../../services/recoveryLearningRunner.js", () => ({
  runRecoveryLearningPass: () => {
    throw new Error("3.5F must not call D-13 learning runner");
  },
}));

import recoveryNormal from "../../scripts/demo/scenarios/recovery-normal.json";
import recoveryDisputed from "../../scripts/demo/scenarios/recovery-disputed.json";
import staleLockScenario from "../../scripts/demo/scenarios/stale-lock.json";
import evidenceExportScenario from "../../scripts/demo/scenarios/evidence-export.json";
import dashboardNormalScenario from "../../scripts/demo/scenarios/dashboard-normal.json";
import dashboardDisputedScenario from "../../scripts/demo/scenarios/dashboard-disputed.json";
import { runRecoveryDemoScenario } from "../../services/recovery/recoveryDemoScenarioRunner.ts";

function createReadModel(overrides: Record<string, any> = {}) {
  return {
    executionId: "demo-recovery-normal",
    execution: { status: "failed" },
    recovery: { status: "completed", attemptsCount: 1 },
    recoveryControl: { status: "approved", latestRequestId: "req_1", requiresApproval: false },
    advisory: {
      status: "request_created",
      latestAdvisoryId: "adv_1",
      recommendation: "resume",
      requiresOperator: false,
      advisoryOnly: true,
    },
    automation: { status: "none", automationAllowed: false },
    autonomy: { status: "none", autonomyAllowed: false },
    verification: { status: "passed" },
    learning: {
      status: "not_run",
      recommendationCount: 0,
      hasPolicyRecommendations: false,
      hasWarnings: false,
      advisoryOnly: true,
    },
    lock: { isLocked: false, stale: false },
    ledger: { totalEvents: 4, lastEventType: "attempt.completed" },
    risk: {
      hasFailure: true,
      hasVerificationFailure: false,
      hasStaleLock: false,
      hasOpenAdvisory: false,
      hasUnsafeUnknown: false,
      hasLearningWarnings: false,
      requiresOperatorAttention: false,
    },
    meta: { completeness: "complete", warnings: [] },
    ...overrides,
  };
}

function createTimeline(overrides: Record<string, any> = {}) {
  return {
    executionId: "demo-recovery-normal",
    events: [
      {
        eventId: "event_1",
        executionId: "demo-recovery-normal",
        timestamp: 1700000000000,
        source: "advisory",
        type: "advisory_created",
        severity: "warning",
        summary: "advisory created",
      },
      {
        eventId: "event_2",
        executionId: "demo-recovery-normal",
        timestamp: 1700000001000,
        source: "recovery",
        type: "recovery_attempt_completed",
        severity: "info",
        summary: "recovery attempt completed",
      },
      {
        eventId: "event_3",
        executionId: "demo-recovery-normal",
        timestamp: 1700000002000,
        source: "verification",
        type: "verification_passed",
        severity: "info",
        summary: "verification passed",
      },
    ],
    meta: {
      totalEvents: 3,
      timeRange: { start: 1700000000000, end: 1700000002000 },
      completeness: "complete",
      warnings: [],
      matchesReadModel: true,
    },
    ...overrides,
  };
}

function createEvidence(state: "normal" | "disputed" = "normal", overrides: Record<string, any> = {}) {
  return {
    executionId: "demo-recovery-normal",
    readModel: createReadModel(),
    timeline: createTimeline({
      meta: {
        totalEvents: 3,
        timeRange: { start: 1700000000000, end: 1700000002000 },
        completeness: state === "disputed" ? "partial" : "complete",
        warnings: state === "disputed" ? ["TIMELINE_STATE_MISMATCH"] : [],
        matchesReadModel: state !== "disputed",
      },
    }),
    state,
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
      hash: state === "disputed" ? "hash_disputed" : "hash_normal",
      algorithm: "sha256",
      matchesReadModel: state !== "disputed",
    },
    meta: {
      completeness: state === "disputed" ? "partial" : "complete",
      warnings: state === "disputed" ? ["Timeline does not explain current state"] : [],
      version: "3.5D-2",
    },
    ...overrides,
  };
}

function createOperatorView(disputed = false, overrides: Record<string, any> = {}) {
  return {
    executionId: "demo-recovery-normal",
    readModel: createReadModel(),
    timeline: createTimeline({
      meta: {
        totalEvents: 3,
        timeRange: { start: 1700000000000, end: 1700000002000 },
        completeness: disputed ? "partial" : "complete",
        warnings: disputed ? ["TIMELINE_STATE_MISMATCH"] : [],
        matchesReadModel: !disputed,
      },
    }),
    timelineMatchesReadModel: !disputed,
    allowedActions: disputed
      ? [
          { action: "ADD_NOTE", allowed: true },
          { action: "REQUEST_VERIFICATION", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "DISMISS_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "ESCALATE_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
          { action: "VIEW_EVIDENCE", allowed: true },
        ]
      : [
          { action: "ADD_NOTE", allowed: true },
          { action: "REQUEST_VERIFICATION", allowed: true },
          { action: "DISMISS_ADVISORY", allowed: true },
          { action: "ESCALATE_ADVISORY", allowed: true },
          { action: "VIEW_EVIDENCE", allowed: true },
        ],
    warnings: disputed ? ["Timeline does not explain current state"] : [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedReadModel.buildRecoveryReadModel.mockResolvedValue({ ok: true, data: createReadModel() });
  mockedTimeline.buildRecoveryTimeline.mockResolvedValue({ ok: true, data: createTimeline() });
  mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({ ok: true, data: createEvidence() });
  mockedExporter.exportRecoveryEvidence.mockImplementation((_bundle: any, format: "json" | "markdown") => ({
    ok: true,
    data: format === "json" ? { exported: true } : "# Recovery Evidence Report",
  }));
  mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({ ok: true, data: createOperatorView(false) });
});

describe("recovery demo scenario runner", () => {
  it("valid scenario parses", async () => {
    const result = await runRecoveryDemoScenario({ scenario: recoveryNormal as any, dryRun: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.scenarioId).toBe("recovery-normal");
  });

  it("invalid scenario fails closed", async () => {
    const result = await runRecoveryDemoScenario({
      scenario: { scenarioId: "bad", title: "bad", description: "bad", executionId: "demo-bad", seed: null, expected: null } as any,
      dryRun: true,
    });
    expect(result).toEqual({
      ok: false,
      error: "BLOCKED_UNSAFE_DEMO_SCENARIO",
      warnings: expect.arrayContaining(["ASSERTION_FAILED"]),
    });
  });

  it("production-looking execution ID rejected", async () => {
    const result = await runRecoveryDemoScenario({
      scenario: { ...recoveryNormal, executionId: "exec-prod-1" } as any,
      dryRun: true,
    });
    expect(result).toEqual({
      ok: false,
      error: "BLOCKED_UNSAFE_DEMO_SCENARIO",
      warnings: expect.arrayContaining(["INVALID_DEMO_EXECUTION_ID"]),
    });
  });

  it("dryRun does not seed data", async () => {
    const result = await runRecoveryDemoScenario({ scenario: recoveryNormal as any, dryRun: true });
    expect(result.ok).toBe(true);
    expect(mockedExecutionStateStore.startExecutionState).not.toHaveBeenCalled();
    expect(mockedExporter.exportRecoveryEvidence).not.toHaveBeenCalled();
  });

  it("normal scenario assertions pass", async () => {
    const result = await runRecoveryDemoScenario({ scenario: recoveryNormal as any });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.ok).toBe(true);
    expect(result.data.readModelSummary.recoveryStatus).toBe("completed");
    expect(result.data.evidenceSummary.state).toBe("normal");
  });

  it("disputed scenario assertions pass", async () => {
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: createTimeline({
        meta: {
          totalEvents: 2,
          timeRange: { start: 1700000000000, end: 1700000001000 },
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({ ok: true, data: createEvidence("disputed") });
    mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({ ok: true, data: createOperatorView(true) });
    const result = await runRecoveryDemoScenario({ scenario: recoveryDisputed as any, validateDashboard: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.evidenceSummary.state).toBe("disputed");
    expect(result.data.dashboardSummary?.mutatingActionsFrozen).toBe(true);
  });

  it("stale lock scenario assertions pass", async () => {
    mockedReadModel.buildRecoveryReadModel.mockResolvedValue({
      ok: true,
      data: createReadModel({
        executionId: "demo-stale-lock",
        execution: { status: "running" },
        recovery: { status: "none", attemptsCount: 0 },
        verification: { status: "not_run" },
        lock: { isLocked: true, stale: true },
        risk: {
          hasFailure: false,
          hasVerificationFailure: false,
          hasStaleLock: true,
          hasOpenAdvisory: false,
          hasUnsafeUnknown: false,
          hasLearningWarnings: false,
          requiresOperatorAttention: true,
        },
        meta: { completeness: "partial", warnings: ["MISSING_LEDGER"] },
      }),
    });
    mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({
      ok: true,
      data: createEvidence("normal", {
        executionId: "demo-stale-lock",
        meta: { completeness: "partial", warnings: ["MISSING_LEDGER"], version: "3.5D-2" },
      }),
    });
    mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({
      ok: true,
      data: createOperatorView(false, {
        executionId: "demo-stale-lock",
        readModel: createReadModel({
          executionId: "demo-stale-lock",
          lock: { isLocked: true, stale: true },
          risk: {
            hasFailure: false,
            hasVerificationFailure: false,
            hasStaleLock: true,
            hasOpenAdvisory: false,
            hasUnsafeUnknown: false,
            hasLearningWarnings: false,
            requiresOperatorAttention: true,
          },
        }),
      }),
    });
    const result = await runRecoveryDemoScenario({ scenario: staleLockScenario as any });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.readModelSummary.operatorAttention).toBe(true);
    expect(result.data.evidenceSummary.warnings).toContain("MISSING_LEDGER");
  });

  it("evidence export scenario produces stable hash", async () => {
    const first = await runRecoveryDemoScenario({ scenario: evidenceExportScenario as any, exportEvidence: true });
    const second = await runRecoveryDemoScenario({ scenario: evidenceExportScenario as any, exportEvidence: true });
    expect(first.ok && second.ok && first.data.evidenceSummary.hash).toBe(second.ok ? second.data.evidenceSummary.hash : "");
    expect(mockedExporter.exportRecoveryEvidence).toHaveBeenCalled();
  });

  it("dashboard-normal scenario assertions pass", async () => {
    const result = await runRecoveryDemoScenario({ scenario: dashboardNormalScenario as any, validateDashboard: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.dashboardSummary).toEqual({
      systemState: "normal",
      evidenceVisible: true,
      exportVisible: true,
      mutatingActionsFrozen: false,
      addNoteAvailable: true,
    });
  });

  it("dashboard-disputed scenario assertions pass", async () => {
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: createTimeline({
        meta: {
          totalEvents: 2,
          timeRange: { start: 1700000000000, end: 1700000001000 },
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({ ok: true, data: createEvidence("disputed") });
    mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({ ok: true, data: createOperatorView(true) });
    const result = await runRecoveryDemoScenario({ scenario: dashboardDisputedScenario as any, validateDashboard: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.dashboardSummary).toEqual({
      systemState: "disputed",
      evidenceVisible: true,
      exportVisible: true,
      mutatingActionsFrozen: true,
      addNoteAvailable: true,
    });
  });

  it("scenario report includes warnings", async () => {
    mockedEvidence.buildRecoveryEvidenceBundle.mockResolvedValue({
      ok: true,
      data: createEvidence("disputed"),
    });
    mockedTimeline.buildRecoveryTimeline.mockResolvedValue({
      ok: true,
      data: createTimeline({
        meta: {
          totalEvents: 2,
          timeRange: { start: 1700000000000, end: 1700000001000 },
          completeness: "partial",
          warnings: ["TIMELINE_STATE_MISMATCH"],
          matchesReadModel: false,
        },
      }),
    });
    mockedOperatorController.getRecoveryOperatorView.mockResolvedValue({ ok: true, data: createOperatorView(true) });
    const result = await runRecoveryDemoScenario({ scenario: recoveryDisputed as any, validateDashboard: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.evidenceSummary.warnings.length).toBeGreaterThan(0);
  });

  it("failed assertions are reported clearly", async () => {
    const result = await runRecoveryDemoScenario({
      scenario: {
        ...recoveryNormal,
        expected: {
          ...recoveryNormal.expected,
          readModel: {
            "recovery.status": "failed",
          },
        },
      } as any,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.ok).toBe(false);
    expect(result.data.assertions.some((assertion) => assertion.name === "readModel.recovery.status" && assertion.passed === false)).toBe(true);
  });
});
