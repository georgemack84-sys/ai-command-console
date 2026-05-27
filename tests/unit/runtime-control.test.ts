import { beforeEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";

import { vi } from "vitest";

vi.mock("tsx/cjs/api", () => ({
  require: vi.fn(() => {
    throw new Error("tsx bridge should not be invoked in runtime-control unit tests.");
  }),
}));

const require = createRequire(import.meta.url);

const runtimeControl = require("../../services/runtimeControl");
const executionEngine = require("../../services/executionEngine");
const executionIntegrityStore = require("../../services/executionIntegrityStore");
const executionStateStore = require("../../services/executionStateStore");
const reviewSurface = require("../../services/reviewSurface");
const stateDatabase = require("../../services/stateDatabase");
const stepController = require("../../services/stepController");
const toolRouter = require("../../services/toolRouter");

describe("runtime control", () => {
  beforeEach(() => {
    process.env.AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH = ":memory:";
    stateDatabase.closeDatabase();
    const now = new Date().toISOString();
    stateDatabase.saveDocument("execution-orchestration-state", {
      createdAt: now,
      updatedAt: now,
      globalState: "idle",
      runs: [],
      bootstraps: [],
      approvalQueue: [],
      anomalies: [],
      safeMode: {
        enabled: false,
        enteredAt: null,
        reason: null,
      },
      sequenceLearning: {
        status: "GAP_UNKNOWN_STRUCTURE",
      },
    });
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, reviewSurface.defaultReviewSurfaceState());
    stateDatabase.saveDocument("execution-backtests", {
      createdAt: now,
      updatedAt: now,
      derivedRecords: [],
    });
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, reviewSurface.defaultLearningState());
  });

  it("blocks synthetic viewer requests before execution", async () => {
    const review = await runtimeControl.reviewRequest(
      { command: "dashboard:system" },
      { role: "viewer", workspaceId: "workspace_1" },
      { identitySource: "human" },
    );

    expect(review.decision.decision).toBe("blocked");

    const engineResult = await executionEngine.execute(
      review.plan,
      { executionMode: "simulate", controlApproved: false, controlDecision: review.decision },
    );

    expect(engineResult).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Routing blocked because reviewStatus is blocked.",
      }),
    );
  });

  it("blocks credential access before routing", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "credential:read", payload: "token" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
      {
        ...runtimeControl.loadControlPolicy(),
        actionCategoryMap: {
          ...runtimeControl.loadControlPolicy().actionCategoryMap,
          "credential:read": "credential_access",
        },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "blocked",
        reason: "credential_access_blocked",
      }),
    );
  });

  it("returns confirmation required for file writes", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "write_file", payload: "notes.txt", content: "hello" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for agent control commands before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "agent_start", payload: { agentName: "planner", goal: "" } },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for workflow control commands before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "manager_route", payload: "Review backlog" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for watcher control actions before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "watcher:start", payload: { intervalSeconds: 5 } },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for alert mutation actions before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "alert:run-checks", payload: {} },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for policy updates before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "policy:update-thresholds", payload: { queuedTasksHigh: 8 } },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("returns confirmation required for governance updates before execution", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "collaboration:update-governance", payload: { sensitiveActionsRequireApproval: true } },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "confirm_required",
      }),
    );
  });

  it("auto-executes read-only job detail actions", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "job:detail", payload: { jobId: "job_2" } },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "auto_execute",
      }),
    );
  });

  it("allows confirmed plugin execution for operators after review", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "run_plugin", payload: "helloPlugin" },
      {
        safeMode: false,
        dryRun: false,
        confirmed: true,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "auto_execute",
        reason: "confirmed_execution",
      }),
    );
  });

  it("allows confirmed file writes for operators after review", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "write_file", payload: "notes.txt", content: "hello" },
      {
        safeMode: false,
        dryRun: false,
        confirmed: true,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "auto_execute",
        reason: "confirmed_execution",
      }),
    );
  });

  it("auto-executes low-risk reads for operators", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "auto_execute",
        reason: "low_risk_auto_execute",
      }),
    );
  });

  it("treats listing plugins as a read-only governed action", () => {
    const decision = runtimeControl.reviewPlan(
      { type: "single", action: "list_plugins", payload: "." },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(decision).toEqual(
      expect.objectContaining({
        decision: "auto_execute",
        reason: "low_risk_auto_execute",
      }),
    );
  });

  it("falls back unclassified actions to shell mutation", () => {
    const classification = runtimeControl.classifyStep({ type: "single", action: "totally:unknown" });

    expect(classification).toEqual(
      expect.objectContaining({
        category: "shell_mutation",
        unclassified: true,
      }),
    );
  });

  it("applies the default system timeout when no timeout source is configured", () => {
    const timeout = runtimeControl.resolveSystemTimeoutSeconds(
      runtimeControl.loadControlPolicy(),
      {},
    );

    expect(timeout).toEqual(
      expect.objectContaining({
        seconds: 300,
        source: "default",
        events: ["TIMEOUT_DEFAULT_APPLIED"],
      }),
    );
  });

  it("stops on conflicting timeout values", () => {
    expect(() =>
      runtimeControl.resolveSystemTimeoutSeconds(
        runtimeControl.loadControlPolicy(),
        { SYSTEM_TIMEOUT_SECONDS: "120", TIMEOUT_SECONDS: "240" },
      ),
    ).toThrow("GAP_TIMEOUT_CONFLICT");
  });

  it("rejects invalid lease and containment rule combinations", () => {
    const invalid = stepController.validateExecutionRules({
      ...stepController.loadExecutionRules(),
      leaseDurationMs: 20000,
      leaseRenewalIntervalMs: 10000,
      maxExecutionAttempts: 2,
      noProgressAttemptLimit: 3,
      maxConsecutiveFailures: 4,
    });

    expect(invalid).toEqual(
      expect.objectContaining({
        ok: false,
        code: "CONFIG_ERROR",
        issues: expect.arrayContaining([
          "leaseDurationMs must be greater than leaseRenewalIntervalMs * 2.",
          "noProgressAttemptLimit must be less than or equal to maxExecutionAttempts.",
          "maxConsecutiveFailures must be less than or equal to maxExecutionAttempts.",
        ]),
      }),
    );
  });

  it("discovers the minimum execution set with controlled result values", () => {
    const discovery = runtimeControl.discoverRuntimeFoundation(runtimeControl.loadControlPolicy());

    expect(discovery.components.executionEngine).toBe("FOUND");
    expect(["FOUND", "PARTIAL", "UNKNOWN"]).toContain(discovery.components.planner);
    expect(["FOUND", "PARTIAL", "UNKNOWN"]).toContain(discovery.components.router);
    expect(discovery.reviewSurface.primary).toBe("api");
  });

  it("rejects invalid planner feedback shorthands", () => {
    expect(() => runtimeControl.validatePlannerFeedback(["adjusted"])).toThrow(
      "GAP_INVALID_PLANNER_FEEDBACK",
    );
  });

  it("prevents router dispatch without control approval", async () => {
    const routeResult = await toolRouter.route(
      {
        type: "single",
        action: "echo",
        payload: "hello",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "auto_execute",
      },
      { executionMode: "confirm_required", controlApproved: false },
    );

    expect(routeResult).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Routing blocked because control approval is required before dispatch.",
      }),
    );
  });

  it("normalizes planner output into a machine-readable candidate plan contract", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "multi",
        originalRequest: "read notes and summarize them",
        steps: [
          { action: "read_file", payload: "notes.txt" },
          { action: "summarize_text", payloadFrom: "previous" },
        ],
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.candidatePlan).toEqual(
      expect.objectContaining({
        originalRequest: "read notes and summarize them",
        intentCategory: "read",
        proposedMode: expect.any(String),
        actorRole: "operator",
        reviewStatus: "pending",
      }),
    );
    expect(analysis.candidatePlan.steps[0]).toEqual(
      expect.objectContaining({
        id: "step_1",
        actionClass: "read",
        tool: "read_file",
        description: expect.any(String),
        reversible: true,
        declaredSideEffects: expect.any(Array),
        permissions: expect.any(Array),
      }),
    );
  });

  it("emits scope drift for mutation on read-only intent", () => {
    const candidate = runtimeControl.normalizeCandidatePlan(
      {
        type: "single",
        originalRequest: "just inspect this",
        intentCategory: "read",
        action: "write_file",
        payload: "notes.txt",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    const review = runtimeControl.runPlanReviewer(candidate, {
      safeMode: false,
      dryRun: false,
      identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
    });

    expect(review.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "scope_drift",
          id: expect.stringContaining("mutation_on_read_only_intent"),
        }),
      ]),
    );
  });

  it("emits assumption risk for missing prerequisites", () => {
    const candidate = runtimeControl.normalizeCandidatePlan(
      {
        type: "single",
        originalRequest: "summarize the missing thing",
        action: "summarize_text",
        payload: "notes.txt",
        requiresPrerequisite: "step_9",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    const review = runtimeControl.runPlanReviewer(candidate, {
      safeMode: false,
      dryRun: false,
      identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
    });

    expect(review.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "assumption_risk",
          id: expect.stringContaining("missing_prerequisite_check"),
        }),
      ]),
    );
  });

  it("splits risky bundles into a preview-first reviewed stage when possible", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "multi",
        originalRequest: "inspect, update, and run plugin",
        steps: [
          { action: "read_file", payload: "notes.txt" },
          { action: "write_file", payload: "notes.txt", content: "updated" },
          { action: "run_plugin", payload: "helloPlugin" },
        ],
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.reviewStatus).toBe("split");
    expect(analysis.review.deferredStepIds).toEqual(["step_2", "step_3"]);
    expect(analysis.review.deferredItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "step_2",
          status: "deferred",
        }),
      ]),
    );
    expect(analysis.reviewedPlan.steps.every((step: { actionClass: string }) => step.actionClass === "read")).toBe(true);
  });

  it("blocks synthetic plans while the planner is available", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        action: "echo",
        payload: "hello",
        originalRequest: "echo hello",
        planQuality: "synthetic",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.reviewStatus).toBe("blocked");
    expect(analysis.decision.decision).toBe("blocked");
  });

  it("blocks steps that exceed the modify cycle limit", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        action: "write_file",
        payload: "notes.txt",
        content: "hello",
        modifyCount: 3,
        originalRequest: "update notes",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.reviewStatus).toBe("blocked");
    expect(analysis.candidatePlan.steps[0].blockReason).toBe("STEP_MODIFY_LIMIT_REACHED");
  });

  it("rewrites order errors without widening action-class scope", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "multi",
        originalRequest: "summarize after reading",
        steps: [
          { id: "step_1", action: "summarize_text", payloadFrom: "previous", requiresPrerequisite: "step_2" },
          { id: "step_2", action: "read_file", payload: "notes.txt" },
        ],
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.reviewStatus).toBe("rewritten");
    expect(analysis.reviewedPlan.steps.map((step: { id: string }) => step.id)).toEqual(["step_2", "step_1"]);
    expect(new Set(analysis.reviewedPlan.steps.map((step: { actionClass: string }) => step.actionClass))).toEqual(
      new Set(analysis.candidatePlan.steps.map((step: { actionClass: string }) => step.actionClass)),
    );
  });

  it("rejects pending or missing review status at the router boundary", async () => {
    const missingStatus = await toolRouter.route(
      { type: "single", action: "echo", payload: "hello" },
      { executionMode: "auto_execute", controlApproved: true },
    );
    const pendingStatus = await toolRouter.route(
      {
        type: "single",
        action: "echo",
        payload: "hello",
        reviewStatus: "pending",
        currentStageExecutable: true,
        finalMode: "auto_execute",
      },
      { executionMode: "auto_execute", controlApproved: true },
    );

    expect(missingStatus.error).toContain("reviewStatus");
    expect(pendingStatus.error).toContain("reviewStatus is pending");
  });

  it("allows only final reviewed plans into the execution engine", async () => {
    const pendingResult = await executionEngine.execute(
      { type: "single", action: "echo", payload: "hello", reviewStatus: "pending", currentStageExecutable: true },
      { executionMode: "auto_execute", controlApproved: true },
    );

    expect(pendingResult).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Routing blocked because reviewStatus is pending.",
      }),
    );
  });

  it("fails if a step re-runs without reset", async () => {
    const rerunResult = await executionEngine.execute(
      {
        type: "single",
        id: "step_1",
        action: "echo",
        payload: "hello",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "auto_execute",
      },
      {
        executionMode: "auto_execute",
        controlApproved: true,
        executedStepIds: ["step_1"],
      },
    );

    expect(rerunResult).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Execution blocked because step step_1 already ran without reset.",
      }),
    );
  });

  it("fails if a dependency chain is violated", async () => {
    const dependencyResult = await executionEngine.execute(
      {
        type: "multi",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "auto_execute",
        steps: [
          {
            id: "step_2",
            action: "summarize_text",
            payload: "hello",
            requiresPrerequisite: "step_1",
          },
        ],
      },
      {
        executionMode: "auto_execute",
        controlApproved: true,
      },
    );

    expect(dependencyResult).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Execution blocked because prerequisite step_1 was not satisfied before step_2.",
      }),
    );
  });

  it("enforces staged execution before running approved work", async () => {
    const result = await executionEngine.execute(
      {
        type: "single",
        id: "step_stage",
        action: "echo",
        payload: "hello",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "safe_execute",
        originalRequest: "echo hello",
      },
      {
        executionMode: "safe_execute",
        controlApproved: true,
      },
    );

    expect(result.ok).toBe(true);
    expect(result.run.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "run_staged", status: "staged" }),
        expect.objectContaining({ eventType: "review_stage", status: "awaiting_review" }),
        expect.objectContaining({ eventType: "execution_start", status: "running" }),
        expect.objectContaining({ eventType: "verification", status: "completed" }),
      ]),
    );
  });

  it("rewrites confirm-required plans to a safe preview stage when available", async () => {
    const result = await executionEngine.execute(
      {
        type: "multi",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "confirm_required",
        originalRequest: "inspect and update",
        steps: [
          { id: "step_read", action: "read_file", payload: "notes.txt", actionClass: "read" },
          { id: "step_write", action: "write_file", payload: "notes.txt", content: "updated", actionClass: "mutate" },
        ],
      },
      {
        executionMode: "confirm_required",
        controlApproved: false,
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        rewritten: true,
        requiresReview: true,
      }),
    );
    expect(result.plan.steps).toEqual([
      expect.objectContaining({ id: "step_read", actionClass: "read" }),
    ]);
    const checkpoint = executionStateStore.loadExecutionCheckpoint(result.run.planId);
    expect(checkpoint).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          status: "awaiting_review",
        }),
      }),
    );
    const state = executionStateStore.loadExecutionState(result.run.runId);
    expect(state.execution).toEqual(
      expect.objectContaining({
        status: "paused_for_review",
        requiresReview: true,
      }),
    );
    const ledger = executionIntegrityStore.listLedgerEvents(result.run.planId, result.run.runId);
    expect(ledger).toEqual(
      expect.objectContaining({
        ok: true,
        data: expect.arrayContaining([
          expect.objectContaining({ eventType: "execution.paused" }),
          expect.objectContaining({ eventType: "review.requested" }),
        ]),
      }),
    );
  });

  it("blocks confirm-required plans that have no safe rewrite", async () => {
    const result = await executionEngine.execute(
      {
        type: "single",
        id: "step_write_only",
        action: "write_file",
        payload: "notes.txt",
        content: "updated",
        actionClass: "mutate",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "confirm_required",
        originalRequest: "update notes",
      },
      {
        executionMode: "confirm_required",
        controlApproved: false,
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        requiresReview: true,
        error: "Execution requires review and no safe rewrite is available.",
      }),
    );
  });

  it("blocks circular dependencies across the orchestration layer", async () => {
    const result = await executionEngine.execute(
      {
        type: "multi",
        reviewStatus: "approved",
        currentStageExecutable: true,
        finalMode: "safe_execute",
        originalRequest: "cycle",
        steps: [
          { id: "step_1", action: "echo", payload: "a", dependsOn: ["step_2"] },
          { id: "step_2", action: "echo", payload: "b", dependsOn: ["step_1"] },
        ],
      },
      {
        executionMode: "safe_execute",
        controlApproved: true,
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "dependency_cycle",
        type: "dependency_cycle",
      }),
    );
  });

  it("marks timed out steps and records verification failure", async () => {
    const originalRoute = toolRouter.route;
    toolRouter.route = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("late"), 50);
        }),
    );

    try {
      const result = await executionEngine.execute(
        {
          type: "single",
          id: "step_timeout",
          action: "echo",
          payload: "slow",
          reviewStatus: "approved",
          currentStageExecutable: true,
          finalMode: "safe_execute",
          originalRequest: "slow echo",
        },
        {
          executionMode: "safe_execute",
          controlApproved: true,
          systemTimeoutSeconds: 0.01,
        },
      );

      expect(result.ok).toBe(false);
      expect(result.run.steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "step_timeout",
            status: "timeout",
          }),
        ]),
      );
      expect(result.run.logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventType: "verification", status: "failed" }),
        ]),
      );
    } finally {
      toolRouter.route = originalRoute;
    }
  });

  it("forces manual review and safe_mode when anomaly thresholds are breached", () => {
    const run = {
      runId: "run_anomaly",
      steps: [{ id: "step_1", status: "failed", duration: 5000 }],
    };
    const orchestration = {
      runs: [
        {
          runId: "previous_complete",
          updatedAt: new Date().toISOString(),
          steps: [{ id: "step_complete", status: "completed", duration: 100 }],
        },
        ...Array.from({ length: 3 }, (_, index) => ({
        runId: `previous_${index}`,
        updatedAt: new Date().toISOString(),
        steps: [{ id: `step_${index}`, status: "failed", duration: 100 }],
        })),
      ],
      approvalQueue: [
        { runId: "review_1", reason: "forced_manual_review", queuedAt: Date.now() },
        { runId: "review_2", reason: "forced_manual_review", queuedAt: Date.now() },
      ],
      anomalies: [],
      safeMode: { enabled: false, enteredAt: null, reason: null },
    };
    const rules = {
      ...stepController.loadExecutionRules(),
      autoApprovalWindowMs: 60_000,
      anomalyThresholds: {
        maxExecutionsPerWindow: 1,
        maxFailureRate: 0.1,
        maxDurationDeviationMs: 50,
        maxOperatorDisagreementRate: 0.1,
      },
    };

    const anomalies = stepController.detectAnomalies(run, orchestration, rules);
    const safeModeState = stepController.enterSafeMode(orchestration, anomalies.join(","));

    expect(anomalies).toEqual(
      expect.arrayContaining([
        "execution_frequency_spike",
        "historical_timing_deviation",
        "failure_rate_increase",
        "operator_disagreement_pattern",
      ]),
    );
    expect(safeModeState).toEqual(
      expect.objectContaining({
        globalState: "safe_mode",
        safeMode: expect.objectContaining({
          enabled: true,
          reason: expect.stringContaining("execution_frequency_spike"),
        }),
      }),
    );
  });

  it("requires explicit operator action to exit safe_mode", () => {
    stepController.commitRuntimeSnapshot(
      {
        runId: "run_safe_mode_seed",
        originalRequest: "seed safe mode",
        executionMode: "safe_execute",
        globalState: "safe_mode",
        updatedAt: new Date().toISOString(),
        steps: [],
      },
      null,
      {
        globalState: "safe_mode",
        safeMode: {
          enabled: true,
          enteredAt: new Date().toISOString(),
          reason: "test_seed",
        },
      },
    );

    const exited = stepController.exitSafeMode({ id: "operator_1" }, "manual_reset");

    expect(exited).toEqual(
      expect.objectContaining({
        globalState: "idle",
        safeMode: expect.objectContaining({
          enabled: false,
          exitedBy: "operator_1",
          exitReason: "manual_reset",
        }),
      }),
    );
  });

  it("queues auto-approval requests when the rate window is exceeded", () => {
    const run = {
      runId: "run_queue",
      originalRequest: "echo hello",
      executionMode: "safe_execute",
      steps: [{ id: "step_1" }],
    };
    const orchestration = {
      runs: [
        {
          runId: "previous_complete",
          updatedAt: new Date().toISOString(),
          steps: [{ id: "step_done", status: "completed", duration: 100 }],
        },
      ],
      approvalQueue: [],
    };
    const rules = {
      ...stepController.loadExecutionRules(),
      autoApprovalMaxPerWindow: 1,
      maxQueueDepth: 2,
      maxQueueWaitMs: 60_000,
    };

    const decision = stepController.evaluateApprovalThrottle(run, orchestration, rules);

    expect(decision).toEqual(
      expect.objectContaining({
        status: "queued",
      }),
    );
    expect(decision.queue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runId: "run_queue",
          reason: "throttled_auto_approval",
        }),
      ]),
    );
  });

  it("forces manual review on queue overflow and queue timeout", () => {
    const run = {
      runId: "run_queue_overflow",
      originalRequest: "echo hello",
      executionMode: "safe_execute",
      steps: [{ id: "step_1" }],
    };
    const now = Date.now();
    const rules = {
      ...stepController.loadExecutionRules(),
      autoApprovalMaxPerWindow: 0,
      maxQueueDepth: 1,
      maxQueueWaitMs: 10,
    };

    const timedOut = stepController.evaluateApprovalThrottle(
      run,
      {
        runs: [],
        approvalQueue: [{ runId: "stale", queuedAt: now - 1000, reason: "throttled_auto_approval" }],
      },
      rules,
    );
    const overflow = stepController.evaluateApprovalThrottle(
      run,
      {
        runs: [
          {
            runId: "previous_complete",
            updatedAt: new Date().toISOString(),
            steps: [{ id: "step_done", status: "completed", duration: 100 }],
          },
        ],
        approvalQueue: [{ runId: "queued_1", queuedAt: now, reason: "throttled_auto_approval" }],
      },
      {
        ...rules,
        maxQueueWaitMs: 60_000,
      },
    );

    expect(timedOut).toEqual(
      expect.objectContaining({
        status: "forced_manual_review",
        queueTimedOut: true,
      }),
    );
    expect(overflow).toEqual(
      expect.objectContaining({
        status: "forced_manual_review",
        overflow: true,
      }),
    );
  });

  it("keeps backtest records isolated from live orchestration state", () => {
    const beforeState = stepController.loadOrchestrationState();
    const record = stepController.recordBacktest(
      {
        id: "backtest_case_1",
        sequenceSignature: "echo>summarize",
        result: "derived_only",
      },
      { initiatedByOperator: true },
    );
    const afterState = stepController.loadOrchestrationState();
    const backtests = stepController.loadBacktestState();

    expect(record.namespace).toBe("backtest");
    expect(backtests.derivedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "backtest_case_1",
          namespace: "backtest",
        }),
      ]),
    );
    expect(afterState.sequenceLearning).toEqual(
      expect.objectContaining({
        status: "GAP_UNKNOWN_STRUCTURE",
      }),
    );
    expect(afterState.runs.length).toBe(beforeState.runs.length);
  });

  it("selects adaptive deep review mode for blocked review states", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        action: "credential:read",
        payload: "token",
        originalRequest: "read credential",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
      {
        ...runtimeControl.loadControlPolicy(),
        actionCategoryMap: {
          ...runtimeControl.loadControlPolicy().actionCategoryMap,
          "credential:read": "credential_access",
        },
      },
    );

    expect(analysis.review).toEqual(
      expect.objectContaining({
        reviewMode: "deep",
        reviewModeReason: expect.stringContaining("blocked"),
      }),
    );
  });

  it("provides delta-aware review output when comparable history exists", () => {
    const now = new Date().toISOString();
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, {
      createdAt: now,
      updatedAt: now,
      reviews: [
        reviewSurface.createReviewRecord(
          "prior_run",
          [{ id: "step_1", actionClass: "read", tool: "read_file", description: "Read file", payload: "notes.txt", riskScore: 10 }],
          "simulate",
          { status: "approved", originalRequest: "read notes" },
        ),
      ],
    });

    const analysis = runtimeControl.analyzePlan(
      {
        type: "multi",
        originalRequest: "read and summarize notes",
        steps: [
          { action: "read_file", payload: "notes.txt" },
          { action: "summarize_text", payloadFrom: "previous" },
        ],
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.deltaAnalysis).toEqual(
      expect.objectContaining({
        status: "available",
        reasonCode: "DELTA_COMPARISON_AVAILABLE",
      }),
    );
    expect(analysis.review.deltaAnalysis.summary).toContain("Delta analysis");
  });

  it("degrades delta and operator pattern insights when bounded history is unavailable", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        originalRequest: "read notes",
        action: "read_file",
        payload: "notes.txt",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.deltaAnalysis).toEqual(
      expect.objectContaining({
        status: "degraded",
        reasonCode: "NO_HISTORY_AVAILABLE",
      }),
    );
    expect(analysis.review.operatorPatternInsights).toEqual(
      expect.objectContaining({
        status: "degraded",
        reasonCode: "NO_HISTORY_AVAILABLE",
      }),
    );
  });

  it("keeps lower-precedence operator pattern signals advisory-only", () => {
    const now = new Date().toISOString();
    stateDatabase.saveDocument(reviewSurface.REVIEW_SURFACE_KEY, {
      createdAt: now,
      updatedAt: now,
      reviews: [
        reviewSurface.createReviewRecord(
          "prior_pending",
          [{ id: "step_1", actionClass: "read", tool: "read_file", description: "Read file", payload: "notes.txt", riskScore: 10 }],
          "confirm_required",
          { status: "pending", originalRequest: "read notes" },
        ),
      ],
    });

    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        action: "credential:read",
        payload: "token",
        originalRequest: "read credential",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
      {
        ...runtimeControl.loadControlPolicy(),
        actionCategoryMap: {
          ...runtimeControl.loadControlPolicy().actionCategoryMap,
          "credential:read": "credential_access",
        },
      },
    );

    expect(analysis.decision.decision).toBe("blocked");
    expect(analysis.review.operatorPatternInsights.summary).toContain("review-surface");
  });

  it("enforces evidence metadata on recommendations", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        originalRequest: "read notes",
        action: "read_file",
        payload: "notes.txt",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.recommendation).toEqual(
      expect.objectContaining({
        sourceType: expect.any(String),
        sourceField: expect.any(String),
        reasonCode: expect.any(String),
      }),
    );
  });

  it("downgrades incomplete evidence items to low-priority advisory output", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "single",
        originalRequest: "read notes",
        action: "read_file",
        payload: "notes.txt",
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.attentionPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reasonCode: "EVIDENCE_INCOMPLETE",
          priority: "low",
          advisoryState: "advisory_incomplete",
        }),
      ]),
    );
  });

  it("routes attention points toward meaningful findings and recommendations", () => {
    const analysis = runtimeControl.analyzePlan(
      {
        type: "multi",
        originalRequest: "inspect, update, and run plugin",
        steps: [
          { action: "read_file", payload: "notes.txt" },
          { action: "write_file", payload: "notes.txt", content: "updated" },
          { action: "run_plugin", payload: "helloPlugin" },
        ],
      },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "admin", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.attentionPoints.length).toBeGreaterThan(0);
    expect(analysis.review.recommendation).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        detail: expect.any(String),
      }),
    );
  });

  it("keeps learning in observation_only mode below the activation threshold", () => {
    for (let index = 0; index < 9; index += 1) {
      runtimeControl.recordLearningEvent({
        sessionId: index < 5 ? "session_a" : "session_b",
        actorId: "user_1",
        actorRole: "operator",
        eventType: "review_observation",
        requestKey: `request_${index}`,
        reviewMode: "standard",
        riskLevel: "medium",
        deltaPresent: false,
        attentionSignals: [],
        outcome: "review_presented",
        evidenceComplete: true,
        reasonCode: "LOW_RISK_REVIEW_PATH",
        recommendationConfidence: 0.5,
        recommendationPriority: "medium",
      });
    }

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningSignals).toEqual(
      expect.objectContaining({
        mode: "observation_only",
      }),
    );
    expect(analysis.review.learningConfidence.markers).toContain("learning_insufficient_data");
  });

  it("applies advisory-only learning after the activation threshold is met", () => {
    reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable learning");
    for (let index = 0; index < 10; index += 1) {
      runtimeControl.recordLearningEvent({
        sessionId: index < 5 ? "session_a" : "session_b",
        actorId: "user_1",
        actorRole: "operator",
        eventType: "review_observation",
        requestKey: `request_${index}`,
        reviewMode: "standard",
        riskLevel: "medium",
        deltaPresent: index % 2 === 0,
        attentionSignals: ["LOW_RISK_REVIEW_PATH"],
        outcome: "executed",
        evidenceComplete: true,
        reasonCode: "LOW_RISK_REVIEW_PATH",
        recommendationConfidence: 0.6,
        recommendationPriority: "medium",
      });
    }

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningSignals.markers).toContain("advisory_applied");
    expect(analysis.review.recommendationCalibration).toEqual(
      expect.objectContaining({
        mode: "advisory_applied",
      }),
    );
  });

  it("freezes learning on conflicting signals", () => {
    reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable learning");
    for (let index = 0; index < 10; index += 1) {
      runtimeControl.recordLearningEvent({
        sessionId: index < 5 ? "session_a" : "session_b",
        actorId: "user_1",
        actorRole: "operator",
        eventType: "review_observation",
        requestKey: `request_${index}`,
        reviewMode: "standard",
        riskLevel: "medium",
        deltaPresent: false,
        attentionSignals: [],
        outcome: index % 2 === 0 ? "executed" : "failed",
        evidenceComplete: true,
        reasonCode: "LOW_RISK_REVIEW_PATH",
        recommendationConfidence: 0.6,
        recommendationPriority: "medium",
      });
    }

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningConfidence.markers).toEqual(
      expect.arrayContaining(["learning_conflict", "learning_unstable"]),
    );
    expect(analysis.review.recommendationCalibration.applied).toBe(false);
  });

  it("marks learning stale when evidence ages out", () => {
    reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable learning");
    const staleTimestamp = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const events = Array.from({ length: 10 }, (_, index) => ({
      id: `learning_${index}`,
      timestamp: staleTimestamp,
      sessionId: index < 5 ? "session_a" : "session_b",
      actorId: "user_1",
      actorRole: "operator",
      eventType: "review_observation",
      requestKey: `request_${index}`,
      reviewMode: "standard",
      riskLevel: "medium",
      deltaPresent: false,
      attentionSignals: [],
      outcome: "executed",
      evidenceComplete: true,
      reasonCode: "LOW_RISK_REVIEW_PATH",
      recommendationConfidence: 0.6,
      recommendationPriority: "medium",
    }));
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, {
      ...reviewSurface.defaultLearningState(),
      mode: "advisory_applied",
      events,
    });

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningConfidence.markers).toContain("learning_stale");
    expect(analysis.review.signalQualityIndicators.markers).toContain("learning_stale");
  });

  it("supports rollback by resetting learning state to defaults", () => {
    reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable learning");
    runtimeControl.recordLearningEvent({
      sessionId: "session_a",
      actorId: "user_1",
      actorRole: "operator",
      eventType: "review_observation",
      requestKey: "request_1",
      reviewMode: "standard",
      riskLevel: "medium",
      deltaPresent: false,
      attentionSignals: [],
      outcome: "executed",
      evidenceComplete: true,
      reasonCode: "LOW_RISK_REVIEW_PATH",
      recommendationConfidence: 0.6,
      recommendationPriority: "medium",
    });

    const reset = runtimeControl.rollbackLearningLayer({ id: "operator_1" }, "test reset");

    expect(reset.mode).toBe("observation_only");
    expect(reset.events).toEqual([]);
    expect(reset.rollback.resetAt).toBeTruthy();
  });

  it("does not apply learning when the layer is disabled", () => {
    reviewSurface.setLearningMode("disabled", { id: "operator_1" }, "disable learning");
    for (let index = 0; index < 10; index += 1) {
      runtimeControl.recordLearningEvent({
        sessionId: index < 5 ? "session_a" : "session_b",
        actorId: "user_1",
        actorRole: "operator",
        eventType: "review_observation",
        requestKey: `request_${index}`,
        reviewMode: "standard",
        riskLevel: "medium",
        deltaPresent: false,
        attentionSignals: [],
        outcome: "executed",
        evidenceComplete: true,
        reasonCode: "LOW_RISK_REVIEW_PATH",
        recommendationConfidence: 0.6,
        recommendationPriority: "medium",
      });
    }

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningSignals.mode).toBe("disabled");
    expect(analysis.review.recommendationCalibration.applied).toBe(false);
  });

  it("bounds learning evaluation to the configured performance window", () => {
    reviewSurface.setLearningMode("advisory_applied", { id: "operator_1" }, "enable learning");
    const events = Array.from({ length: 80 }, (_, index) => ({
      id: `learning_${index}`,
      timestamp: new Date().toISOString(),
      sessionId: index < 40 ? "session_a" : "session_b",
      actorId: "user_1",
      actorRole: "operator",
      eventType: "review_observation",
      requestKey: `request_${index}`,
      reviewMode: "standard",
      riskLevel: "medium",
      deltaPresent: false,
      attentionSignals: [],
      outcome: "executed",
      evidenceComplete: true,
      reasonCode: "LOW_RISK_REVIEW_PATH",
      recommendationConfidence: 0.6,
      recommendationPriority: "medium",
    }));
    stateDatabase.saveDocument(reviewSurface.LEARNING_STATE_KEY, {
      ...reviewSurface.defaultLearningState(),
      mode: "advisory_applied",
      events,
    });

    const analysis = runtimeControl.analyzePlan(
      { type: "single", originalRequest: "read notes", action: "read_file", payload: "notes.txt" },
      {
        safeMode: false,
        dryRun: false,
        identity: { sourceIdentity: "human", role: "operator", maxExecutionMode: "auto_execute" },
      },
    );

    expect(analysis.review.learningSignals.eventCount).toBeLessThanOrEqual(50);
  });
});
