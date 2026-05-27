import { DEFAULT_SAM_APPROVAL, DEFAULT_SAM_DRY_RUN, DEFAULT_SAM_PREFLIGHT, SAM_MODE } from "./samConstants";
import { SAM_ERROR_CODES, createSamError } from "./samErrors";
import { loadSamFeatureFlags } from "./samFeatureFlags";
import { validateSamProposal } from "./samProposalSchema";
import { runSamPreflight } from "./samPreflight";
import { evaluateSamApproval } from "./samApprovalGate";
import { generateSamDryRun } from "./samDryRunExecutor";
import { appendDeduplicatedSamAuditEvent } from "./samAuditDeduplication";
import { createSamIdempotencyKey } from "./samIdempotencyKey";
import { ensureIdempotentExecution } from "./samEnsureIdempotentExecution";
import { hashSamValue } from "./samProposalHash";
import { storeSamIdempotencyResult } from "./samIdempotencyStore";
import { measureSamAsyncDuration, measureSamSyncDuration } from "./performance/samLatencyTracker";
import { recordSamThroughputEvent } from "./performance/samThroughputTracker";
import { beginSamProposal, finishSamProposal, getSamProposalPriority } from "./scaling/samQueueGovernor";
import { SAM_SCALING_ERROR_CODES } from "./scaling/samScalingErrors";
import type { SamBridgeResult, SamError } from "./samTypes";

function buildBlockedResult({
  proposalId,
  executionId,
  tenantId,
  workspaceId,
  stage,
  reason,
  preflight = DEFAULT_SAM_PREFLIGHT,
  approval = DEFAULT_SAM_APPROVAL,
  dryRun = DEFAULT_SAM_DRY_RUN,
  audit,
  errors,
}: {
  proposalId: string;
  executionId: string;
  tenantId?: string;
  workspaceId?: string;
  stage: SamBridgeResult["stage"];
  reason: string;
  preflight?: SamBridgeResult["preflight"];
  approval?: SamBridgeResult["approval"];
  dryRun?: SamBridgeResult["dryRun"];
  audit: SamBridgeResult["audit"];
  errors: SamError[];
}): SamBridgeResult {
  return {
    ok: false,
    mode: SAM_MODE,
    proposalId,
    executionId,
    tenantId,
    workspaceId,
    attemptId: undefined,
    idempotencyKey: undefined,
    stage,
    blocked: true,
    reason,
    preflight,
    approval,
    dryRun,
    audit,
    errors,
  };
}

function withIdempotencyContext(
  result: SamBridgeResult,
  context: { attemptId?: string; idempotencyKey?: string },
): SamBridgeResult {
  return {
    ...result,
    attemptId: context.attemptId,
    idempotencyKey: context.idempotencyKey,
  };
}

function finalizeStoredResult({
  result,
  proposalHash,
  status,
  replayable,
}: {
  result: SamBridgeResult;
  proposalHash: string;
  status: "completed" | "failed" | "blocked" | "ambiguous";
  replayable: boolean;
}) {
  if (!result.attemptId || !result.idempotencyKey) {
    return;
  }

  storeSamIdempotencyResult({
    tenantId: result.tenantId,
    workspaceId: result.workspaceId,
    executionId: result.executionId,
    attemptId: result.attemptId,
    idempotencyKey: result.idempotencyKey,
    actionType: result.dryRun.actionType,
    proposalHash,
    resultHash: hashSamValue(result),
    result,
    status,
    replayable,
  });
}

export async function runSamBridge({
  db,
  proposal,
  approval,
  nowMs,
}: {
  db?: unknown;
  proposal: unknown;
  approval?: {
    status: "required" | "granted" | "denied" | "not_applicable";
    approvedBy?: string;
    reason?: string;
  };
  nowMs?: number;
}): Promise<SamBridgeResult> {
  const errors: SamError[] = [];
  let proposalAdmissionStarted = false;
  const validated = measureSamSyncDuration("sam.proposal.validation.duration", () => validateSamProposal(proposal));
  const fallbackProposalId = String((proposal as any)?.proposalId || "");
  const fallbackExecutionId = String((proposal as any)?.executionId || "");
  const fallbackAttemptId = String((proposal as any)?.attemptId || "");

  try {
    return await measureSamAsyncDuration("sam.bridge.duration", async () => {
      if (!validated.ok) {
        return {
          ok: false,
          mode: SAM_MODE,
          proposalId: fallbackProposalId,
          executionId: fallbackExecutionId,
          tenantId: undefined,
          workspaceId: undefined,
          attemptId: fallbackAttemptId || undefined,
          stage: "blocked",
          blocked: true,
          reason: SAM_ERROR_CODES.SAM_PROPOSAL_INVALID,
          preflight: DEFAULT_SAM_PREFLIGHT,
          approval: DEFAULT_SAM_APPROVAL,
          dryRun: DEFAULT_SAM_DRY_RUN,
          audit: {
            attempted: false,
            appended: false,
            skipped: true,
            reason: "PROPOSAL_VALIDATION_FAILED",
          },
          errors: validated.errors,
        };
      }

      const normalizedProposal = validated.data;
      const tenantContext = normalizedProposal.tenantContext;
      const flags = loadSamFeatureFlags();
      const idempotency = createSamIdempotencyKey({
        proposal: normalizedProposal,
        approval,
      });

      if (!idempotency.ok) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_INPUT_INVALID, "Invalid idempotency input.", "proposal"));
        return withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason: SAM_ERROR_CODES.SAM_IDEMPOTENCY_INPUT_INVALID,
            audit: {
              attempted: false,
              appended: false,
              skipped: true,
              reason: "IDEMPOTENCY_KEY_RESOLUTION_FAILED",
            },
            errors,
          }),
          { attemptId: normalizedProposal.attemptId },
        );
      }

      const { idempotencyKey, proposalHash } = idempotency.data;

      if (!flags.enabled) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_DISABLED, "S.A.M. bridge mode is disabled.", "proposal"));
        return withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason: SAM_ERROR_CODES.SAM_DISABLED,
            audit: {
              attempted: false,
              appended: false,
              skipped: true,
              reason: "SAM_DISABLED",
            },
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
      }

      const idempotencyDecision = flags.samIdempotencyEnabled && flags.samRetrySafetyEnabled
        ? ensureIdempotentExecution({
            tenantId: tenantContext?.tenantId,
            workspaceId: tenantContext?.workspaceId,
            executionId: normalizedProposal.executionId,
            attemptId: normalizedProposal.attemptId,
            idempotencyKey,
            actionType: normalizedProposal.actionType,
            proposalHash,
          })
        : {
            status: "blocked_ambiguous" as const,
            executionId: normalizedProposal.executionId,
            attemptId: normalizedProposal.attemptId,
            idempotencyKey,
            reason: SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS,
          };

      if (idempotencyDecision.status === "duplicate_returned" && idempotencyDecision.result) {
        await appendDeduplicatedSamAuditEvent({
          db,
          type: "sam.idempotency.duplicate_returned",
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: {
            originalResultHash: idempotencyDecision.resultHash,
          },
        });
        await appendDeduplicatedSamAuditEvent({
          db,
          type: "sam.retry.replay_returned",
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: {
            originalResultHash: idempotencyDecision.resultHash,
          },
        });
        return idempotencyDecision.result as SamBridgeResult;
      }

      if (idempotencyDecision.status !== "new_attempt") {
        const reason =
          idempotencyDecision.reason
          || (idempotencyDecision.status === "unsafe_retry"
            ? SAM_ERROR_CODES.SAM_UNSAFE_RETRY
            : SAM_ERROR_CODES.SAM_IDEMPOTENCY_CONFLICT);
        errors.push(createSamError(reason, "S.A.M. idempotency blocked the proposal.", "blocked"));
        const auditType =
          idempotencyDecision.status === "unsafe_retry" || idempotencyDecision.status === "blocked_ambiguous"
            ? "sam.retry.blocked"
            : "sam.idempotency.conflict_blocked";
        const blockedAudit = await appendDeduplicatedSamAuditEvent({
          db,
          type: auditType,
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: { reason },
        });
        const blocked = withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason,
            audit: blockedAudit,
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
        finalizeStoredResult({ result: blocked, proposalHash, status: "blocked", replayable: false });
        return blocked;
      }

      const admission = beginSamProposal({
        priority: getSamProposalPriority({
          actionType: normalizedProposal.actionType,
          approvalStatus: approval?.status,
        }),
      });

      if (!admission.allowed) {
        errors.push(createSamError(SAM_SCALING_ERROR_CODES.SAM_QUEUE_PRESSURE_REJECTED, "Queue pressure rejected the proposal.", "blocked"));
        return withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason: SAM_SCALING_ERROR_CODES.SAM_QUEUE_PRESSURE_REJECTED,
            audit: {
              attempted: false,
              appended: false,
              skipped: true,
              reason: admission.reason || SAM_SCALING_ERROR_CODES.SAM_QUEUE_PRESSURE_REJECTED,
            },
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
      }
      proposalAdmissionStarted = true;

      let latestAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type: "sam.idempotency.accepted",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: {
          actionType: normalizedProposal.actionType,
          proposalHash,
        },
      });

      if (latestAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, latestAudit.reason || "Audit skipped.", "audit", true));
      }

      latestAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type: "sam.proposal.created",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: {
          actionType: normalizedProposal.actionType,
          riskLevel: normalizedProposal.riskLevel,
          confidence: normalizedProposal.confidence,
          proposalHash,
          nowMs,
        },
      });

      if (latestAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, latestAudit.reason || "Audit skipped.", "audit", true));
      }

      const preflight = await runSamPreflight({
        db,
        proposal: normalizedProposal,
        nowMs,
      });

      latestAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type: preflight.allowed ? "sam.preflight.passed" : "sam.preflight.failed",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: { reason: preflight.reason, checks: preflight.checks },
      });
      if (latestAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, latestAudit.reason || "Audit skipped.", "audit", true));
      }

      if (flags.realExecutionEnabled || normalizedProposal.params?.realExecution === true) {
        errors.push(
          createSamError(
            SAM_ERROR_CODES.SAM_REAL_EXECUTION_FORBIDDEN,
            "Real execution is forbidden in 3.6A bridge mode.",
            "blocked",
          ),
        );
        const blockedAudit = await appendDeduplicatedSamAuditEvent({
          db,
          type: "sam.bridge.blocked",
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: { reason: SAM_ERROR_CODES.SAM_REAL_EXECUTION_FORBIDDEN },
        });
        if (blockedAudit.skipped) {
          errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, blockedAudit.reason || "Audit skipped.", "audit", true));
        }
        const blocked = withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason: SAM_ERROR_CODES.SAM_REAL_EXECUTION_FORBIDDEN,
            preflight,
            approval: DEFAULT_SAM_APPROVAL,
            dryRun: {
              ...DEFAULT_SAM_DRY_RUN,
              dryRun: true,
              executed: false,
              blockedEffects: ["real execution blocked in 3.6A"],
            },
            audit: blockedAudit,
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
        finalizeStoredResult({ result: blocked, proposalHash, status: "blocked", replayable: false });
        return blocked;
      }

      if (preflight.blocked || !preflight.allowed) {
        errors.push(
          createSamError(
            preflight.reason || SAM_ERROR_CODES.SAM_PREFLIGHT_FAILED,
            "S.A.M. preflight blocked the proposal.",
            "preflight",
          ),
        );
        const blockedAudit = await appendDeduplicatedSamAuditEvent({
          db,
          type: "sam.bridge.blocked",
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: { reason: preflight.reason },
        });
        if (blockedAudit.skipped) {
          errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, blockedAudit.reason || "Audit skipped.", "audit", true));
        }
        const blocked = withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason: preflight.reason || SAM_ERROR_CODES.SAM_PREFLIGHT_FAILED,
            preflight,
            audit: blockedAudit,
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
        finalizeStoredResult({ result: blocked, proposalHash, status: "blocked", replayable: false });
        return blocked;
      }

      const approvalResult = evaluateSamApproval({
        actionType: normalizedProposal.actionType,
        requireApproval: flags.requireApproval,
        approval,
      });

      latestAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type:
          approvalResult.status === "granted"
            ? "sam.approval.granted"
            : approvalResult.status === "denied"
              ? "sam.approval.denied"
              : "sam.approval.required",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: { approval: approvalResult },
      });
      if (latestAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, latestAudit.reason || "Audit skipped.", "audit", true));
      }

      if (!approvalResult.granted) {
        const reason = approvalResult.reason || SAM_ERROR_CODES.SAM_APPROVAL_REQUIRED;
        errors.push(
          createSamError(
            reason,
            approvalResult.denied ? "S.A.M. approval denied." : "S.A.M. approval required.",
            "approval",
          ),
        );
        const blockedAudit = await appendDeduplicatedSamAuditEvent({
          db,
          type: "sam.bridge.blocked",
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          attemptId: normalizedProposal.attemptId,
          idempotencyKey,
          actor: normalizedProposal.requestedBy,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          payload: { reason },
        });
        if (blockedAudit.skipped) {
          errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, blockedAudit.reason || "Audit skipped.", "audit", true));
        }
        const blocked = withIdempotencyContext(
          buildBlockedResult({
            proposalId: normalizedProposal.proposalId,
            executionId: normalizedProposal.executionId,
            stage: "blocked",
            reason,
            preflight,
            approval: approvalResult,
            audit: blockedAudit,
            errors,
          }),
          { attemptId: normalizedProposal.attemptId, idempotencyKey },
        );
        finalizeStoredResult({ result: blocked, proposalHash, status: "blocked", replayable: false });
        return blocked;
      }

      const dryRun = await generateSamDryRun({
        proposal: normalizedProposal,
      });

      latestAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type: "sam.dry_run.generated",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: { dryRun },
      });
      if (latestAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, latestAudit.reason || "Audit skipped.", "audit", true));
      }

      const completedAudit = await appendDeduplicatedSamAuditEvent({
        db,
        type: "sam.bridge.completed",
        proposalId: normalizedProposal.proposalId,
        executionId: normalizedProposal.executionId,
        attemptId: normalizedProposal.attemptId,
        idempotencyKey,
        actor: normalizedProposal.requestedBy,
        tenantId: tenantContext?.tenantId,
        workspaceId: tenantContext?.workspaceId,
        payload: { stage: "completed" },
      });
      if (completedAudit.skipped) {
        errors.push(createSamError(SAM_ERROR_CODES.SAM_AUDIT_SKIPPED, completedAudit.reason || "Audit skipped.", "audit", true));
      }

      const unrecoverableErrors = errors.filter((error) => error.recoverable !== true);
      const completed = withIdempotencyContext(
        {
          ok: unrecoverableErrors.length === 0,
          mode: SAM_MODE,
          proposalId: normalizedProposal.proposalId,
          executionId: normalizedProposal.executionId,
          tenantId: tenantContext?.tenantId,
          workspaceId: tenantContext?.workspaceId,
          stage: "completed",
          blocked: false,
          preflight,
          approval: approvalResult,
          dryRun,
          audit: completedAudit,
          errors,
        },
        { attemptId: normalizedProposal.attemptId, idempotencyKey },
      );
      finalizeStoredResult({ result: completed, proposalHash, status: "completed", replayable: true });
      recordSamThroughputEvent("bridge_completed");
      return completed;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected S.A.M. bridge failure.";
    errors.push(createSamError(SAM_ERROR_CODES.SAM_IDEMPOTENCY_AMBIGUOUS, message, "blocked"));
    return {
      ok: false,
      mode: SAM_MODE,
      proposalId: validated.ok ? validated.data.proposalId : fallbackProposalId,
      executionId: validated.ok ? validated.data.executionId : fallbackExecutionId,
      tenantId: validated.ok ? validated.data.tenantContext?.tenantId : undefined,
      workspaceId: validated.ok ? validated.data.tenantContext?.workspaceId : undefined,
      attemptId: validated.ok ? validated.data.attemptId : fallbackAttemptId || undefined,
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
        reason: "SAM_BRIDGE_UNEXPECTED_FAILURE",
      },
      errors,
    };
  } finally {
    if (proposalAdmissionStarted) {
      finishSamProposal();
    }
  }
}
