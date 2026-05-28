import fs from "node:fs";
import path from "node:path";

import { withDatabase } from "../stateDatabase.js";
import * as executionStateStore from "../executionStateStore.js";
import * as executionIntegrityStore from "../executionIntegrityStore.js";
import * as recoveryAuditStore from "../recoveryAuditStore.js";
import * as recoveryAdvisoryStore from "../recoveryAdvisoryStore.js";
import * as recoveryAutomationStore from "../recoveryAutomationStore.js";
import * as recoveryAutonomyStore from "../recoveryAutonomyStore.js";
import * as recoveryVerificationStore from "../recoveryVerificationStore.js";
import * as recoveryLearningStore from "../recoveryLearningStore.js";

import {
  DEMO_EXECUTION_PREFIX,
  DEMO_EXPORT_DIR,
  DEMO_NOW_MS,
  DEMO_SCENARIO_ERRORS,
  DEMO_SCENARIO_WARNINGS,
} from "../../constants/recoveryDemoScenario.constants";
import type {
  RecoveryDemoScenario,
  RecoveryDemoScenarioReport,
  RecoveryDemoScenarioResult,
} from "../../types/recoveryDemoScenario";
import type { RecoveryEvidenceBundle } from "../../types/recoveryEvidence";
import type { OperatorView } from "../../types/recoveryOperatorApi";
import { buildRecoveryReadModel } from "./recoveryReadModel";
import { buildRecoveryTimeline } from "./recoveryTimelineBuilder";
import { buildRecoveryEvidenceBundle } from "./recoveryEvidenceBuilder";
import { exportRecoveryEvidence as renderEvidenceExport } from "./recoveryEvidenceExporter";
import { getRecoveryOperatorView } from "../../controllers/recoveryOperatorController";

type Assertion = RecoveryDemoScenarioReport["assertions"][number];

type RunnerInput = {
  db?: unknown;
  scenario: RecoveryDemoScenario;
  dryRun?: boolean;
  exportEvidence?: boolean;
  validateDashboard?: boolean;
};

function failClosed(warnings: string[] = []): RecoveryDemoScenarioResult {
  return {
    ok: false,
    error: DEMO_SCENARIO_ERRORS.BLOCKED_UNSAFE_DEMO_SCENARIO,
    ...(warnings.length > 0 ? { warnings: Array.from(new Set(warnings)) } : {}),
  };
}

function success(data: RecoveryDemoScenarioReport): RecoveryDemoScenarioResult {
  return { ok: true, data };
}

function normalizeExecutionId(value: unknown): string {
  return String(value || "").trim();
}

function isRecord(value: unknown): value is Record<string, any> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function validateScenario(scenario: unknown): scenario is RecoveryDemoScenario {
  if (!isRecord(scenario)) {
    return false;
  }
  if (!normalizeExecutionId(scenario.executionId) || !normalizeExecutionId(scenario.scenarioId)) {
    return false;
  }
  if (!isRecord(scenario.seed) || !isRecord(scenario.expected)) {
    return false;
  }
  return true;
}

function deriveDashboardSystemState(evidence: RecoveryEvidenceBundle | null): "normal" | "disputed" | "partial" | "unknown" {
  if (!evidence) {
    return "unknown";
  }
  if (evidence.state === "normal") {
    return "normal";
  }
  if (evidence.state === "disputed") {
    return "disputed";
  }
  if (evidence.meta.completeness === "partial") {
    return "partial";
  }
  return "unknown";
}

function getValueAtPath(target: unknown, pathExpression: string): unknown {
  return pathExpression.split(".").reduce<unknown>((current, segment) => {
    if (current == null) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isInteger(index) ? current[index] : undefined;
    }
    if (typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, target);
}

function buildAssertion(name: string, expected: any, actual: any): Assertion {
  return {
    name,
    expected,
    actual,
    passed: Object.is(expected, actual),
  };
}

function flattenExpectationAssertions(prefix: string, expected: Record<string, any> | undefined, actualTarget: unknown): Assertion[] {
  if (!expected) {
    return [];
  }
  const assertions: Assertion[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if (key === "warningsIncludes") {
      const warnings = Array.isArray((actualTarget as any)?.warnings)
        ? (actualTarget as any).warnings
        : Array.isArray((actualTarget as any)?.meta?.warnings)
          ? (actualTarget as any).meta.warnings
          : [];
      assertions.push({
        name: `${prefix}.warningsIncludes`,
        expected: value,
        actual: warnings,
        passed: warnings.includes(value),
      });
      continue;
    }

    const pathName = key.includes(".") ? `${prefix}.${key}` : `${prefix}.${key}`;
    const actualValue = getValueAtPath(actualTarget, key);
    assertions.push(buildAssertion(pathName, value, actualValue));
  }
  return assertions;
}

function buildOperatorActionAssertions(expectedActions: string[] | undefined, allowedActions: string[]): Assertion[] {
  if (!Array.isArray(expectedActions)) {
    return [];
  }
  return expectedActions.map((action) => ({
    name: `operatorActions.${action}`,
    expected: true,
    actual: allowedActions.includes(action),
    passed: allowedActions.includes(action),
  }));
}

function buildDashboardAssertions(expected: RecoveryDemoScenario["expected"]["dashboardState"], actual: RecoveryDemoScenarioReport["dashboardSummary"]): Assertion[] {
  if (!expected || !actual) {
    return [];
  }
  return [
    buildAssertion("dashboardState.systemState", expected.systemState, actual.systemState),
    buildAssertion("dashboardState.evidenceVisible", expected.evidenceVisible, actual.evidenceVisible),
    buildAssertion("dashboardState.exportVisible", expected.exportVisible, actual.exportVisible),
    buildAssertion("dashboardState.mutatingActionsFrozen", expected.mutatingActionsFrozen, actual.mutatingActionsFrozen),
    buildAssertion("dashboardState.addNoteAvailable", expected.addNoteAvailable, actual.addNoteAvailable),
  ];
}

function defaultPlan(executionId: string) {
  return {
    id: `plan_${executionId}`,
    steps: [
      {
        id: "step_0",
        action: "read_file",
        payload: "demo.txt",
        metadata: {
          idempotent: true,
          retryStrategy: "safe",
        },
      },
    ],
  };
}

function seedExecutionSnapshot(executionId: string, executionSeed: Record<string, any> = {}) {
  const plan = defaultPlan(executionId);
  executionStateStore.startExecutionState(plan);
  const status = String(executionSeed.status || "running");
  executionStateStore.persistExecutionSnapshot({
    runId: executionId,
    planId: plan.id,
    globalState: status,
    reviewStatus: status === "paused_for_review" ? "pending" : "approved",
    triggerSource: executionSeed.triggerSource || "api",
    createdAt: executionSeed.createdAt || new Date(DEMO_NOW_MS - 5000).toISOString(),
    startedAt: executionSeed.startedAt || new Date(DEMO_NOW_MS - 4000).toISOString(),
    finishedAt:
      status === "running" || status === "pending"
        ? executionSeed.finishedAt || null
        : executionSeed.finishedAt || new Date(DEMO_NOW_MS - 1000).toISOString(),
    steps: [
      {
        id: "step_0",
        sequence: 1,
        stageId: "stage_1",
        status: status === "running" ? "pending" : status,
        action: "read_file",
        kind: "read_file",
        originalInput: "demo.txt",
        normalizedInput: "demo.txt",
        idempotencyClass: "safe_repeat",
        isIdempotent: true,
        sideEffects: [],
      },
    ],
    stages: [
      {
        id: "stage_1",
        sequence: 1,
        name: "Stage 1",
        status,
      },
    ],
  });
  return plan.id;
}

function seedStaleLock(planId: string, executionId: string, lockSeed: Record<string, any>, nowMs: number) {
  const leaseExpiresAt = Number(lockSeed.leaseExpiresAt ?? (nowMs + Number(lockSeed.leaseOffsetMs ?? -60000)));
  const ownerId = String(lockSeed.ownerId || "demo-worker");

  withDatabase((db: any) => {
    db.prepare(`
      INSERT INTO execution_locks (
        plan_id, execution_id, worker_id, lock_acquired_at, heartbeat_at, lease_expires_at, lock_released_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
      ON CONFLICT(plan_id) DO UPDATE SET
        execution_id = excluded.execution_id,
        worker_id = excluded.worker_id,
        lock_acquired_at = excluded.lock_acquired_at,
        heartbeat_at = excluded.heartbeat_at,
        lease_expires_at = excluded.lease_expires_at,
        lock_released_at = NULL,
        created_at = excluded.created_at
    `).run(
      planId,
      executionId,
      ownerId,
      nowMs - 120000,
      nowMs + Number(lockSeed.heartbeatOffsetMs ?? -90000),
      leaseExpiresAt,
      nowMs - 120000,
    );

    db.prepare(`
      UPDATE executions
      SET lease_owner = ?, lease_expires_at = ?, last_updated_at = ?
      WHERE id = ?
    `).run(ownerId, leaseExpiresAt, new Date(nowMs).toISOString(), executionId);
  });
}

function seedLedger(planId: string, executionId: string, events: any[] = []) {
  for (const event of events) {
    executionIntegrityStore.appendLedgerEvent({
      planId,
      executionId,
      stepId: event.stepId ?? null,
      eventType: event.eventType,
      payload: event.payload || {},
    });
  }
}

function seedRecovery(planId: string, executionId: string, recoveryEvents: any[] = []) {
  for (const event of recoveryEvents) {
    const created = executionIntegrityStore.createExecutionAttempt({
      planId,
      executionId,
      stepId: event.stepId || "step_0",
      sideEffectClass: event.sideEffectClass || "unknown",
      idempotencyKey: event.idempotencyKey,
    });
    const attemptNumber = Number(created?.data?.attemptNumber || 1);
    const status = String(event.status || "pending");
    if (status === "completed") {
      executionIntegrityStore.completeExecutionAttempt(planId, executionId, event.stepId || "step_0", attemptNumber, event.resultPayload || {});
    } else if (status === "failed") {
      executionIntegrityStore.failExecutionAttempt(planId, executionId, event.stepId || "step_0", attemptNumber, event.errorPayload || {});
    }
  }
}

function seedControl(executionId: string, planId: string, controlEvents: any[] = []) {
  for (const event of controlEvents) {
    const recoveryRequestId = String(event.recoveryRequestId || `request_${executionId}`);
    const recoveryMode = String(event.recoveryMode || "resume");
    const requestedBy = String(event.requestedBy || "operator_demo");
    const planPayload = event.plan || { executionId, planId };
    const planHash = event.planHash || { token: `hash_${recoveryRequestId}` };
    switch (String(event.type || "")) {
      case "request":
        recoveryAuditStore.recordRecoveryRequest({
          recoveryRequestId,
          executionId,
          recoveryMode,
          requestedBy,
          plan: planPayload,
          planHash,
        });
        break;
      case "policy":
        recoveryAuditStore.recordPolicyDecision({
          recoveryRequestId,
          executionId,
          requestedBy,
          policy: event.policy || { allowed: true, requiresApproval: true, reason: "approval", policyCode: "SAFE" },
        });
        break;
      case "approval":
        recoveryAuditStore.recordApproval({
          recoveryRequestId,
          executionId,
          approvedBy: event.approvedBy || requestedBy,
        });
        break;
      case "commit_result":
        recoveryAuditStore.recordCommitResult({
          recoveryRequestId,
          executionId,
          requestedBy,
          result: event.result || { ok: true },
        });
        break;
      default:
        break;
    }
  }
}

function seedAdvisory(executionId: string, advisories: any[] = []) {
  for (const advisory of advisories) {
    const advisoryId = String(advisory.advisoryId || `adv_${executionId}`);
    switch (String(advisory.type || "")) {
      case "created":
        recoveryAdvisoryStore.recordAdvisoryCreated({
          advisoryId,
          executionId,
          candidate: advisory.candidate || { signalType: "FAILED_EXECUTION" },
          requestedBy: advisory.requestedBy || "system",
        });
        break;
      case "recommended":
        recoveryAdvisoryStore.recordAdvisoryRecommendation({
          advisoryId,
          executionId,
          signal: advisory.signal || null,
          recommendation: advisory.recommendation || null,
          explanation: advisory.explanation || null,
          requestedBy: advisory.requestedBy || "system",
        });
        break;
      case "escalated":
        recoveryAdvisoryStore.recordAdvisoryEscalated({
          advisoryId,
          executionId,
          escalatedBy: advisory.escalatedBy || "operator_demo",
          reason: advisory.reason || "needs review",
        });
        break;
      case "dismissed":
        recoveryAdvisoryStore.recordAdvisoryDismissed({
          advisoryId,
          executionId,
          dismissedBy: advisory.dismissedBy || "operator_demo",
          reason: advisory.reason || "resolved",
        });
        break;
      case "request_created":
        recoveryAdvisoryStore.recordAdvisoryRequestCreated({
          advisoryId,
          executionId,
          requestedBy: advisory.requestedBy || "operator_demo",
          recoveryRequest: advisory.recoveryRequest || {},
        });
        break;
      default:
        break;
    }
  }
}

function seedAutomation(automationEvents: any[] = []) {
  for (const event of automationEvents) {
    if (String(event.type || "") === "blocked") {
      recoveryAutomationStore.recordAutomationBlocked({
        executionId: event.executionId,
        advisoryId: event.advisoryId,
        signalType: event.signalType || "FAILED_EXECUTION",
        recommendation: event.recommendation || "operator_recovery",
        policy: event.policy || { allowed: false },
        requestedBy: event.requestedBy || "operator_demo",
        reason: event.reason || "cooldown",
      });
    } else if (String(event.type || "") === "policy") {
      recoveryAutomationStore.recordAutomationPolicyEvaluated({
        executionId: event.executionId,
        advisoryId: event.advisoryId,
        signalType: event.signalType || "FAILED_EXECUTION",
        recommendation: event.recommendation || "operator_recovery",
        policy: event.policy || { allowed: true, action: "create_request", reason: "eligible" },
        requestedBy: event.requestedBy || "operator_demo",
      });
    }
  }
}

function seedAutonomy(autonomyEvents: any[] = []) {
  for (const event of autonomyEvents) {
    if (String(event.type || "") === "policy") {
      recoveryAutonomyStore.recordAutonomyPolicyEvaluated({
        recoveryRequestId: event.recoveryRequestId,
        executionId: event.executionId,
        policy: event.policy || { action: "manual_approval_required", reason: "manual" },
        requestedBy: event.requestedBy || "operator_demo",
      });
    } else if (String(event.type || "") === "blocked") {
      recoveryAutonomyStore.recordAutonomyAutoApprovalBlocked({
        recoveryRequestId: event.recoveryRequestId,
        executionId: event.executionId,
        gate: event.gate || { reason: "blocked" },
        requestedBy: event.requestedBy || "operator_demo",
      });
    }
  }
}

function seedVerification(executionId: string, verificationEvents: any[] = []) {
  for (const event of verificationEvents) {
    recoveryVerificationStore.recordVerificationResult({
      recoveryRequestId: event.recoveryRequestId || `request_${executionId}`,
      executionId,
      verification: event.verification || { outcome: "UNKNOWN", verified: false, reason: "missing" },
      requestedBy: event.requestedBy || "operator_demo",
    });
  }
}

function seedLearning(executionId: string, learningEvents: any[] = []) {
  for (const event of learningEvents) {
    if (String(event.type || "") === "signals") {
      recoveryLearningStore.recordLearningSignalsAggregated({
        signals: event.signals || { totals: { unknown: 1 }, warnings: ["missing"] },
        requestedBy: event.requestedBy || "operator_demo",
      });
    } else if (String(event.type || "") === "report") {
      recoveryLearningStore.recordLearningReportCreated({
        report: {
          executionId,
          ...(event.report || { summary: "demo report", recommendations: [] }),
        },
        requestedBy: event.requestedBy || "operator_demo",
      });
    } else if (String(event.type || "") === "failed") {
      recoveryLearningStore.recordLearningRunFailed({
        requestedBy: event.requestedBy || "operator_demo",
        reason: event.reason || "failed",
      });
    }
  }
}

function ensureExportDir() {
  const exportDir = path.join(process.cwd(), DEMO_EXPORT_DIR);
  fs.mkdirSync(exportDir, { recursive: true });
  return exportDir;
}

function exportEvidenceBundle(scenarioId: string, bundle: RecoveryEvidenceBundle) {
  const exportDir = ensureExportDir();
  const jsonResult = renderEvidenceExport(bundle, "json");
  const markdownResult = renderEvidenceExport(bundle, "markdown");
  if (jsonResult.ok) {
    fs.writeFileSync(path.join(exportDir, `${scenarioId}.json`), JSON.stringify(jsonResult.data, null, 2), "utf8");
  }
  if (markdownResult.ok) {
    fs.writeFileSync(path.join(exportDir, `${scenarioId}.md`), String(markdownResult.data), "utf8");
  }
}

function deriveDashboardSummary(view: OperatorView, evidence: RecoveryEvidenceBundle) {
  const allowed = new Set(view.allowedActions.filter((entry) => entry.allowed).map((entry) => entry.action));
  return {
    systemState: deriveDashboardSystemState(evidence),
    evidenceVisible: true,
    exportVisible: true,
    mutatingActionsFrozen:
      !allowed.has("REQUEST_VERIFICATION")
      && !allowed.has("DISMISS_ADVISORY")
      && !allowed.has("ESCALATE_ADVISORY"),
    addNoteAvailable: allowed.has("ADD_NOTE"),
  } as RecoveryDemoScenarioReport["dashboardSummary"];
}

function summarizeOperatorActions(view: OperatorView) {
  return {
    allowed: view.allowedActions.filter((entry) => entry.allowed).map((entry) => entry.action),
    blocked: view.allowedActions
      .filter((entry) => !entry.allowed)
      .map((entry) => ({
        action: entry.action,
        reason: entry.reason,
      })),
  };
}

function baseDryRunReport(scenario: RecoveryDemoScenario): RecoveryDemoScenarioReport {
  return {
    scenarioId: scenario.scenarioId,
    executionId: scenario.executionId,
    ok: true,
    readModelSummary: {},
    timelineSummary: {
      totalEvents: 0,
      matchesReadModel: false,
    },
    evidenceSummary: {
      state: "normal",
      warnings: [DEMO_SCENARIO_WARNINGS.DRY_RUN_NO_SEED],
    },
    operatorSummary: {
      allowed: [],
      blocked: [],
    },
    assertions: [
      {
        name: "dryRun.validScenario",
        expected: true,
        actual: true,
        passed: true,
      },
    ],
  };
}

export async function runRecoveryDemoScenario({
  db,
  scenario,
  dryRun = false,
  exportEvidence = false,
  validateDashboard = false,
}: RunnerInput): Promise<RecoveryDemoScenarioResult> {
  const warnings: string[] = [];
  try {
    if (!validateScenario(scenario)) {
      return failClosed([DEMO_SCENARIO_WARNINGS.ASSERTION_FAILED]);
    }

    const executionId = normalizeExecutionId(scenario.executionId);
    if (!executionId.startsWith(DEMO_EXECUTION_PREFIX)) {
      return failClosed([DEMO_SCENARIO_WARNINGS.INVALID_DEMO_EXECUTION_ID]);
    }

    if (dryRun) {
      return success(baseDryRunReport(scenario));
    }

    const planId = seedExecutionSnapshot(executionId, scenario.seed.execution || {});
    if (scenario.seed.lock && isRecord(scenario.seed.lock) && scenario.seed.lock.stale) {
      seedStaleLock(planId, executionId, scenario.seed.lock, DEMO_NOW_MS);
    } else if (scenario.seed.lock && isRecord(scenario.seed.lock)) {
      executionIntegrityStore.acquireExecutionLock(planId, executionId);
    }
    seedLedger(planId, executionId, scenario.seed.ledger || []);
    seedRecovery(planId, executionId, scenario.seed.recovery || []);
    seedControl(executionId, planId, scenario.seed.control || []);
    seedAdvisory(executionId, scenario.seed.advisory || []);
    seedAutomation((scenario.seed.automation || []).map((entry) => ({ executionId, ...entry })));
    seedAutonomy((scenario.seed.autonomy || []).map((entry) => ({ executionId, ...entry })));
    seedVerification(executionId, scenario.seed.verification || []);
    seedLearning(executionId, scenario.seed.learning || []);

    const readModelResult = await buildRecoveryReadModel({ db, executionId, nowMs: DEMO_NOW_MS });
    const timelineResult = await buildRecoveryTimeline({ db, executionId, nowMs: DEMO_NOW_MS });
    const evidenceResult = await buildRecoveryEvidenceBundle({ db, executionId, nowMs: DEMO_NOW_MS });
    const operatorViewResult = await getRecoveryOperatorView({ db, executionId, nowMs: DEMO_NOW_MS });

    if (!readModelResult.ok || !timelineResult.ok || !evidenceResult.ok || !operatorViewResult.ok) {
      return failClosed([DEMO_SCENARIO_WARNINGS.PARTIAL_DEMO_OUTPUT]);
    }

    if (exportEvidence) {
      exportEvidenceBundle(scenario.scenarioId, evidenceResult.data);
    }

    const operatorSummary = summarizeOperatorActions(operatorViewResult.data);
    const dashboardSummary = validateDashboard ? deriveDashboardSummary(operatorViewResult.data, evidenceResult.data) : undefined;

    const assertions: Assertion[] = [
      ...flattenExpectationAssertions("readModel", scenario.expected.readModel, readModelResult.data),
      ...flattenExpectationAssertions("timeline", scenario.expected.timeline, timelineResult.data),
      ...flattenExpectationAssertions("evidence", scenario.expected.evidence, evidenceResult.data),
      ...buildOperatorActionAssertions(scenario.expected.operatorActions, operatorSummary.allowed),
      ...buildDashboardAssertions(scenario.expected.dashboardState, dashboardSummary),
    ];

    const reportWarnings = Array.from(
      new Set([
        ...readModelResult.data.meta.warnings,
        ...timelineResult.data.meta.warnings,
        ...evidenceResult.data.meta.warnings,
      ]),
    );

    if (readModelResult.data.meta.completeness === "partial" || timelineResult.data.meta.completeness === "partial") {
      warnings.push(DEMO_SCENARIO_WARNINGS.PARTIAL_DEMO_OUTPUT);
    }
    if (validateDashboard && dashboardSummary && scenario.expected.dashboardState) {
      const dashboardPassed = buildDashboardAssertions(scenario.expected.dashboardState, dashboardSummary).every((entry) => entry.passed);
      if (!dashboardPassed) {
        warnings.push(DEMO_SCENARIO_WARNINGS.DASHBOARD_VALIDATION_FAILED);
      }
    }
    if (assertions.some((entry) => !entry.passed)) {
      warnings.push(DEMO_SCENARIO_WARNINGS.ASSERTION_FAILED);
    }

    const report: RecoveryDemoScenarioReport = {
      scenarioId: scenario.scenarioId,
      executionId,
      ok: assertions.every((entry) => entry.passed),
      readModelSummary: {
        recoveryStatus: readModelResult.data.recovery.status,
        verificationStatus: readModelResult.data.verification.status,
        advisoryStatus: readModelResult.data.advisory.status,
        operatorAttention: readModelResult.data.risk.requiresOperatorAttention,
      },
      timelineSummary: {
        totalEvents: timelineResult.data.events.length,
        matchesReadModel: timelineResult.data.meta.matchesReadModel,
      },
      evidenceSummary: {
        state: evidenceResult.data.state,
        hash: evidenceResult.data.integrity.hash,
        warnings: Array.from(new Set([...reportWarnings, ...warnings])),
      },
      operatorSummary,
      ...(dashboardSummary ? { dashboardSummary } : {}),
      assertions,
    };

    return success(report);
  } catch {
    return failClosed(warnings);
  }
}

export default {
  runRecoveryDemoScenario,
};
