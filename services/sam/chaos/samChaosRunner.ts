import { DEFAULT_SAM_APPROVAL, DEFAULT_SAM_DRY_RUN, DEFAULT_SAM_PREFLIGHT, SAM_MODE } from "../samConstants";
import { createSamIdempotencyKey } from "../samIdempotencyKey";
import { clearSamIdempotencyStore, storeSamIdempotencyResult } from "../samIdempotencyStore";
import { clearSamAuditDeduplicationState } from "../samAuditDeduplication";
import { appendDeduplicatedSamAuditEvent } from "../samAuditDeduplication";
import { ensureIdempotentExecution } from "../samEnsureIdempotentExecution";
import { evaluateSamApproval } from "../samApprovalGate";
import { generateSamDryRun } from "../samDryRunExecutor";
import { SAM_ERROR_CODES, createSamError } from "../samErrors";
import { hashSamValue } from "../samProposalHash";
import { measureSamAsyncDuration } from "../performance/samLatencyTracker";
import { recordSamThroughputEvent } from "../performance/samThroughputTracker";
import { attachSamChaosScore } from "./samChaosStabilityScore";
import { SAM_CHAOS_ERROR_CODES } from "./samChaosErrors";
import { configureSamChaosFailureInjection, clearSamChaosFailureInjection, getSamChaosMetrics } from "./samFailureInjection";
import { createSamChaosHookMode, validateSamChaosScenario } from "./samChaosScenarioFactory";
import type { SamChaosScenarioRequest, SamChaosScenarioResult } from "./samChaosTypes";
import type { SamAuditResult, SamBridgeResult, SamError, SamProposal } from "../samTypes";

function baseProposal(request: SamChaosScenarioRequest): SamProposal {
  return {
    proposalId: `proposal-${request.deterministicSeed}`,
    executionId: request.executionId,
    attemptId: request.attemptId,
    actionType: "recover_execution" as const,
    requestedBy: "ai" as const,
    reason: `Chaos scenario ${request.type}`,
    riskLevel: "high" as const,
    confidence: 0.9,
    params: {},
    createdAt: "2026-05-07T00:00:00.000Z",
  };
}

async function runSamChaosBridgeAttempt({
  proposal,
  approval,
  preflightAllowed = true,
  preflightReason,
}: {
  proposal: ReturnType<typeof baseProposal>;
  approval?: {
    status: "required" | "granted" | "denied" | "not_applicable";
    approvedBy?: string;
    reason?: string;
  };
  preflightAllowed?: boolean;
  preflightReason?: string;
}): Promise<SamBridgeResult> {
  const errors: SamError[] = [];
  const appendAudit = async (type: string, payload?: Record<string, unknown>): Promise<SamAuditResult> => {
    const audit = await appendDeduplicatedSamAuditEvent({
      type,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey: keyResult.ok ? keyResult.data.idempotencyKey : "missing_idempotency_key",
      actor: proposal.requestedBy,
      payload,
    });

    if (audit.skipped) {
      errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, audit.reason || "Audit skipped.", "audit", true));
    }

    return audit;
  };

  const keyResult = createSamIdempotencyKey({ proposal, approval });
  if (!keyResult.ok) {
    return {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      stage: "blocked",
      blocked: true,
      reason: "SAM_IDEMPOTENCY_INPUT_INVALID",
      preflight: DEFAULT_SAM_PREFLIGHT,
      approval: DEFAULT_SAM_APPROVAL,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit: {
        attempted: false,
        appended: false,
        skipped: true,
        reason: "IDEMPOTENCY_KEY_RESOLUTION_FAILED",
      },
      errors,
    };
  }

  const { idempotencyKey, proposalHash } = keyResult.data;
  let decision: ReturnType<typeof ensureIdempotentExecution>;
  try {
    decision = ensureIdempotentExecution({
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      actionType: proposal.actionType,
      proposalHash,
    });
  } catch (error) {
    errors.push(
      createSamError(
        SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS,
        error instanceof Error ? error.message : "Idempotency store failure.",
        "blocked",
      ),
    );
    return {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason: SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS,
      preflight: DEFAULT_SAM_PREFLIGHT,
      approval: DEFAULT_SAM_APPROVAL,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit: {
        attempted: false,
        appended: false,
        skipped: true,
        reason: error instanceof Error ? error.message : "IDEMPOTENCY_STORE_FAILURE",
      },
      errors,
    };
  }

  if (decision.status === "duplicate_returned" && decision.result) {
    await appendAudit("sam.idempotency.duplicate_returned", { originalResultHash: decision.resultHash });
    await appendAudit("sam.retry.replay_returned", { originalResultHash: decision.resultHash });
    const prior = decision.result as SamBridgeResult;
    return errors.length > 0 ? { ...prior, errors: [...(prior.errors || []), ...errors] } : prior;
  }

  if (decision.status !== "new_attempt") {
    const reason =
      decision.reason
      || (decision.status === "unsafe_retry" ? "SAM_UNSAFE_RETRY" : "SAM_IDEMPOTENCY_CONFLICT");
    const audit = await appendAudit(
      decision.status === "blocked_conflict" ? "sam.idempotency.conflict_blocked" : "sam.retry.blocked",
      { reason },
    );
    const blocked: SamBridgeResult = {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason,
      preflight: DEFAULT_SAM_PREFLIGHT,
      approval: DEFAULT_SAM_APPROVAL,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit,
      errors,
    };
    try {
      storeSamIdempotencyResult({
        executionId: proposal.executionId,
        attemptId: proposal.attemptId,
        idempotencyKey,
        actionType: proposal.actionType,
        proposalHash,
        resultHash: hashSamValue(blocked),
        result: blocked,
        status: "blocked",
        replayable: false,
      });
    } catch (error) {
      errors.push(createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS, error instanceof Error ? error.message : "Store failure.", "blocked"));
    }
    return blocked;
  }

  await appendAudit("sam.idempotency.accepted", { proposalHash });

  const preflight = preflightAllowed
    ? {
        allowed: true,
        blocked: false,
        checks: {
          readModelAvailable: true,
          operatorActionAllowed: true,
          evidenceValid: true,
          timelineConsistent: true,
          lockValid: true,
          disputedState: false,
        },
        source: {
          readModel: "CHAOS_SIMULATED",
          operatorView: "CHAOS_SIMULATED",
          evidence: "CHAOS_SIMULATED",
          timeline: "CHAOS_SIMULATED",
        },
      }
    : {
        ...DEFAULT_SAM_PREFLIGHT,
        reason: preflightReason || "SAM_PREFLIGHT_FAILED",
      };

  const resolvedPreflightReason = "reason" in preflight && preflight.reason
    ? preflight.reason
    : preflight.allowed
      ? "SAM_PREFLIGHT_PASSED"
      : "SAM_PREFLIGHT_FAILED";

  await appendAudit(preflight.allowed ? "sam.preflight.passed" : "sam.preflight.failed", { reason: resolvedPreflightReason });

  if (!preflight.allowed) {
    const blocked: SamBridgeResult = {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason: resolvedPreflightReason,
      preflight,
      approval: DEFAULT_SAM_APPROVAL,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit: {
        attempted: false,
        appended: false,
        skipped: false,
      },
      errors,
    };
    try {
      storeSamIdempotencyResult({
        executionId: proposal.executionId,
        attemptId: proposal.attemptId,
        idempotencyKey,
        actionType: proposal.actionType,
        proposalHash,
        resultHash: hashSamValue(blocked),
        result: blocked,
        status: "blocked",
        replayable: false,
      });
    } catch (error) {
      errors.push(createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS, error instanceof Error ? error.message : "Store failure.", "blocked"));
    }
    return blocked;
  }

  if (proposal.params?.realExecution === true) {
    return {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason: "SAM_REAL_EXECUTION_FORBIDDEN",
      preflight,
      approval: DEFAULT_SAM_APPROVAL,
      dryRun: {
        ...DEFAULT_SAM_DRY_RUN,
        blockedEffects: ["real execution blocked in chaos bridge"],
      },
      audit: {
        attempted: false,
        appended: false,
        skipped: true,
        reason: "SAM_REAL_EXECUTION_FORBIDDEN",
      },
      errors,
    };
  }

  const approvalResult = evaluateSamApproval({
    actionType: proposal.actionType,
    requireApproval: true,
    approval,
  });
  await appendAudit(
    approvalResult.status === "granted"
      ? "sam.approval.granted"
      : approvalResult.status === "denied"
        ? "sam.approval.denied"
        : "sam.approval.required",
    { approval: approvalResult },
  );

  if (!approvalResult.granted) {
    const blocked: SamBridgeResult = {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason: approvalResult.reason || "SAM_APPROVAL_REQUIRED",
      preflight,
      approval: approvalResult,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit: {
        attempted: false,
        appended: false,
        skipped: false,
      },
      errors,
    };
    try {
      storeSamIdempotencyResult({
        executionId: proposal.executionId,
        attemptId: proposal.attemptId,
        idempotencyKey,
        actionType: proposal.actionType,
        proposalHash,
        resultHash: hashSamValue(blocked),
        result: blocked,
        status: "blocked",
        replayable: false,
      });
    } catch (error) {
      errors.push(createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS, error instanceof Error ? error.message : "Store failure.", "blocked"));
    }
    return blocked;
  }

  try {
    const dryRun = await generateSamDryRun({ proposal });
    const audit = await appendAudit("sam.dry_run.generated", { dryRun });
    const completed: SamBridgeResult = {
      ok: true,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "completed",
      blocked: false,
      preflight,
      approval: approvalResult,
      dryRun,
      audit,
      errors,
    };
    try {
      storeSamIdempotencyResult({
        executionId: proposal.executionId,
        attemptId: proposal.attemptId,
        idempotencyKey,
        actionType: proposal.actionType,
        proposalHash,
        resultHash: hashSamValue(completed),
        result: completed,
        status: "completed",
        replayable: true,
      });
    } catch (error) {
      return {
        ok: false,
        mode: SAM_MODE,
        proposalId: proposal.proposalId,
        executionId: proposal.executionId,
        attemptId: proposal.attemptId,
        idempotencyKey,
        stage: "blocked",
        blocked: true,
        reason: SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS,
        preflight,
        approval: approvalResult,
        dryRun: DEFAULT_SAM_DRY_RUN,
        audit: {
          attempted: false,
          appended: false,
          skipped: true,
          reason: error instanceof Error ? error.message : "STORE_FAILURE_AFTER_DRY_RUN",
        },
        errors: [
          ...errors,
          createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS, error instanceof Error ? error.message : "Store failure.", "blocked"),
        ],
      };
    }
    await appendAudit("sam.bridge.completed", { stage: "completed" });
    return completed;
  } catch (error) {
    errors.push(
      createSamError(
        SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS,
        error instanceof Error ? error.message : "UNKNOWN_DRY_RUN_FAILURE",
        "blocked",
      ),
    );
    return {
      ok: false,
      mode: SAM_MODE,
      proposalId: proposal.proposalId,
      executionId: proposal.executionId,
      attemptId: proposal.attemptId,
      idempotencyKey,
      stage: "blocked",
      blocked: true,
      reason: "SAM_IDEMPOTENCY_AMBIGUOUS",
      preflight,
      approval: approvalResult,
      dryRun: DEFAULT_SAM_DRY_RUN,
      audit: {
        attempted: false,
        appended: false,
        skipped: true,
        reason: error instanceof Error ? error.message : "UNKNOWN_DRY_RUN_FAILURE",
      },
      errors,
    };
  }
}

function withSamChaosEnv<T>(fn: () => Promise<T>): Promise<T> {
  const originalEnv = {
    SAM_ENABLED: process.env.SAM_ENABLED,
    SAM_DRY_RUN: process.env.SAM_DRY_RUN,
    SAM_REQUIRE_APPROVAL: process.env.SAM_REQUIRE_APPROVAL,
    SAM_IDEMPOTENCY_ENABLED: process.env.SAM_IDEMPOTENCY_ENABLED,
    SAM_RETRY_SAFETY_ENABLED: process.env.SAM_RETRY_SAFETY_ENABLED,
    SAM_AUDIT_DEDUPLICATION_ENABLED: process.env.SAM_AUDIT_DEDUPLICATION_ENABLED,
    SAM_DURABLE_IDEMPOTENCY_ENABLED: process.env.SAM_DURABLE_IDEMPOTENCY_ENABLED,
  };

  process.env.SAM_ENABLED = "true";
  process.env.SAM_DRY_RUN = "true";
  process.env.SAM_REQUIRE_APPROVAL = "true";
  process.env.SAM_IDEMPOTENCY_ENABLED = "true";
  process.env.SAM_RETRY_SAFETY_ENABLED = "true";
  process.env.SAM_AUDIT_DEDUPLICATION_ENABLED = "true";
  process.env.SAM_DURABLE_IDEMPOTENCY_ENABLED = "false";

  return fn().finally(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

async function runDuplicateReplayScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  const first = await runSamChaosBridgeAttempt({ proposal, approval });
  const second = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: `${proposal.attemptId}-retry`,
    },
    approval,
  });
  const metrics = getSamChaosMetrics();
  const duplicateDryRunDetected = metrics.dryRunInvocationCount > 1;
  const duplicateAuditDetected = Object.values(metrics.auditEventCounts).some((count) => count > 1);
  return attachSamChaosScore({
    type: request.type,
    passed: first.ok && second.ok && !duplicateDryRunDetected && !duplicateAuditDetected,
    recoveryCorrect: first.ok && second.ok && !duplicateDryRunDetected && !duplicateAuditDetected,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected,
    duplicateAuditDetected,
    governanceBypassDetected: false,
    findings: [
      `firstStage=${first.stage}`,
      `secondStage=${second.stage}`,
      `dryRunCount=${metrics.dryRunInvocationCount}`,
      `auditCount=${metrics.auditAppendCount}`,
    ],
  });
}

async function runStoreFailureScenario(request: SamChaosScenarioRequest, failRead = false) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  configureSamChaosFailureInjection({
    ...createSamChaosHookMode(request),
    failStoreRead: failRead,
    failStoreWrite: !failRead,
  });
  const result = await runSamChaosBridgeAttempt({ proposal, approval });
  const metrics = getSamChaosMetrics();
  return attachSamChaosScore({
    type: request.type,
    passed: result.blocked && result.reason === "SAM_IDEMPOTENCY_AMBIGUOUS" && metrics.dryRunInvocationCount === 0,
    recoveryCorrect: result.blocked && metrics.dryRunInvocationCount === 0,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: metrics.dryRunInvocationCount > 1,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    findings: [
      `reason=${result.reason || "none"}`,
      `stage=${result.stage}`,
      `storeReads=${metrics.storeReadCount}`,
      `storeWrites=${metrics.storeWriteCount}`,
    ],
  });
}

async function runPartialWriteScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  const keyResult = createSamIdempotencyKey({ proposal, approval });
  if (!keyResult.ok) {
    return attachSamChaosScore({
      type: request.type,
      passed: false,
      recoveryCorrect: false,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: [SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO],
    });
  }
  storeSamIdempotencyResult({
    executionId: proposal.executionId,
    attemptId: proposal.attemptId,
    idempotencyKey: keyResult.data.idempotencyKey,
    actionType: proposal.actionType,
    proposalHash: keyResult.data.proposalHash,
    status: "pending",
    replayable: false,
  });

  const retry = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: `${proposal.attemptId}-retry`,
    },
    approval,
  });
  const metrics = getSamChaosMetrics();
  return attachSamChaosScore({
    type: request.type,
    passed: retry.blocked && metrics.dryRunInvocationCount === 0,
    recoveryCorrect: retry.blocked && metrics.dryRunInvocationCount === 0,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: metrics.dryRunInvocationCount > 1,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    findings: [
      `reason=${retry.reason || "none"}`,
      `stage=${retry.stage}`,
      "pending state prevented replay",
    ],
  });
}

async function runTimeoutScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  configureSamChaosFailureInjection(createSamChaosHookMode(request));
  const first = await runSamChaosBridgeAttempt({ proposal, approval });
  const firstMetrics = getSamChaosMetrics();
  clearSamChaosFailureInjection();
  const second = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: `${proposal.attemptId}-retry`,
    },
    approval,
  });
  const secondMetrics = getSamChaosMetrics();
  const totalDryRunCount = firstMetrics.dryRunInvocationCount + secondMetrics.dryRunInvocationCount;
  return attachSamChaosScore({
    type: request.type,
    passed: first.blocked && second.blocked,
    recoveryCorrect: first.blocked && second.blocked && second.reason === "SAM_IDEMPOTENCY_AMBIGUOUS",
    unauthorizedMutationDetected: firstMetrics.unauthorizedMutationDetected || secondMetrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: totalDryRunCount > 1,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    findings: [
      `firstReason=${first.reason || "none"}`,
      `secondReason=${second.reason || "none"}`,
      `dryRunCount=${totalDryRunCount}`,
    ],
  });
}

async function runCorruptedStateScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  const keyResult = createSamIdempotencyKey({ proposal, approval });
  if (!keyResult.ok) {
    return attachSamChaosScore({
      type: request.type,
      passed: false,
      recoveryCorrect: false,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: [SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO],
    });
  }
  storeSamIdempotencyResult({
    executionId: proposal.executionId,
    attemptId: proposal.attemptId,
    idempotencyKey: keyResult.data.idempotencyKey,
    actionType: proposal.actionType,
    proposalHash: "mismatched_hash",
    status: "completed",
    replayable: true,
    result: { ok: true },
  });
  const result = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: `${proposal.attemptId}-retry`,
    },
    approval,
  });
  const metrics = getSamChaosMetrics();
  return attachSamChaosScore({
    type: request.type,
    passed: result.blocked && result.reason === "SAM_IDEMPOTENCY_CONFLICT",
    recoveryCorrect: result.blocked,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: metrics.dryRunInvocationCount > 0,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    findings: [
      `reason=${result.reason || "none"}`,
      "proposal hash mismatch treated as conflict",
    ],
  });
}

async function runAuditFailureScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  configureSamChaosFailureInjection(createSamChaosHookMode(request));
  const result = await runSamChaosBridgeAttempt({ proposal, approval });
  const metrics = getSamChaosMetrics();
  const auditFailureVisible = result.errors.some((error) => error.code === "SAM_AUDIT_SKIPPED");
  return attachSamChaosScore({
    type: request.type,
    passed: auditFailureVisible && result.audit.skipped === true,
    recoveryCorrect: auditFailureVisible && result.audit.skipped === true && !result.blocked ? true : auditFailureVisible,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: metrics.dryRunInvocationCount > 1,
    duplicateAuditDetected: metrics.auditAppendCount > 1 && metrics.auditSkipCount === 0,
    governanceBypassDetected: false,
    findings: [
      `auditSkipped=${result.audit.skipped === true}`,
      `errorCodes=${result.errors.map((error) => error.code).join(",")}`,
    ],
  });
}

async function runLockLossScenario(request: SamChaosScenarioRequest) {
  const proposal = baseProposal(request);
  const approval = { status: "granted" as const, approvedBy: "operator_1" };
  const keyResult = createSamIdempotencyKey({ proposal, approval });
  if (!keyResult.ok) {
    return attachSamChaosScore({
      type: request.type,
      passed: false,
      recoveryCorrect: false,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: [SAM_CHAOS_ERROR_CODES.SAM_CHAOS_INVALID_SCENARIO],
    });
  }
  storeSamIdempotencyResult({
    executionId: proposal.executionId,
    attemptId: proposal.attemptId,
    idempotencyKey: keyResult.data.idempotencyKey,
    actionType: proposal.actionType,
    proposalHash: keyResult.data.proposalHash,
    status: "ambiguous",
    replayable: false,
  });
  const ambiguousRetry = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: `${proposal.attemptId}-retry`,
    },
    approval,
  });
  const conflictingKey = await runSamChaosBridgeAttempt({
    proposal: {
      ...proposal,
      attemptId: proposal.attemptId,
    },
    approval: { status: "required" as const },
  });
  const metrics = getSamChaosMetrics();
  return attachSamChaosScore({
    type: request.type,
    passed:
      ambiguousRetry.blocked
      && conflictingKey.blocked
      && metrics.dryRunInvocationCount === 0,
    recoveryCorrect:
      ambiguousRetry.blocked
      && conflictingKey.blocked
      && metrics.dryRunInvocationCount === 0,
    unauthorizedMutationDetected: metrics.unauthorizedMutationDetected,
    duplicateDryRunDetected: metrics.dryRunInvocationCount > 0,
    duplicateAuditDetected: false,
    governanceBypassDetected: false,
    findings: [
      `ambiguousReason=${ambiguousRetry.reason || "none"}`,
      `conflictReason=${conflictingKey.reason || "none"}`,
    ],
  });
}

export async function runSamChaosScenario(request: SamChaosScenarioRequest): Promise<SamChaosScenarioResult> {
  const validation = validateSamChaosScenario(request);
  if (!validation.ok) {
    return attachSamChaosScore({
      type: request.type,
      passed: false,
      recoveryCorrect: false,
      unauthorizedMutationDetected: false,
      duplicateDryRunDetected: false,
      duplicateAuditDetected: false,
      governanceBypassDetected: false,
      findings: [validation.error],
    });
  }

  return withSamChaosEnv(async () => measureSamAsyncDuration("sam.chaos.scenario.duration", async () => {
    clearSamChaosFailureInjection();
    clearSamIdempotencyStore();
    clearSamAuditDeduplicationState();
    configureSamChaosFailureInjection(createSamChaosHookMode(request));

    try {
      switch (request.type) {
        case "DUPLICATE_REPLAY":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runDuplicateReplayScenario(request);
        case "DB_FAILURE":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runStoreFailureScenario(request, false);
        case "IDEMPOTENCY_STORE_FAILURE":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runStoreFailureScenario(request, true);
        case "PARTIAL_WRITE":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runPartialWriteScenario(request);
        case "TIMEOUT_MID_EXECUTION":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runTimeoutScenario(request);
        case "CORRUPTED_STATE_READ":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runCorruptedStateScenario(request);
        case "AUDIT_APPEND_FAILURE":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runAuditFailureScenario(request);
        case "LOCK_LOSS":
          recordSamThroughputEvent("chaos_scenario_completed");
          return await runLockLossScenario(request);
        default:
          return attachSamChaosScore({
            type: request.type,
            passed: false,
            recoveryCorrect: false,
            unauthorizedMutationDetected: false,
            duplicateDryRunDetected: false,
            duplicateAuditDetected: false,
            governanceBypassDetected: false,
            findings: [SAM_CHAOS_ERROR_CODES.SAM_CHAOS_UNSUPPORTED_FAILURE_TYPE],
          });
      }
    } finally {
      clearSamChaosFailureInjection();
    }
  }));
}
