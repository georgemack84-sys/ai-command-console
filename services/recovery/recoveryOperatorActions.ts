import { appendAuditEvent } from "../auditTrail.js";
import * as recoveryVerificationController from "../recoveryVerificationController.js";
import * as recoveryVerificationStore from "../recoveryVerificationStore.js";
import * as recoveryAdvisoryController from "../recoveryAdvisoryController.js";

import {
  OPERATOR_API_ERRORS,
  OPERATOR_API_REASONS,
} from "../../constants/recoveryOperatorApi.constants";
import type {
  OperatorAction,
  OperatorActionResult,
  OperatorView,
} from "../../types/recoveryOperatorApi";
import type { RecoveryReadModel } from "../../types/recoveryReadModel";
import type { RecoveryTimeline } from "../../types/recoveryTimeline";
import { buildRecoveryReadModel } from "./recoveryReadModel";
import { buildRecoveryTimeline } from "./recoveryTimelineBuilder";
import type { TenantContext } from "../tenancy/tenantTypes";

type OperatorSuccess<T> = { ok: true; data: T };
type OperatorFailure = {
  ok: false;
  error: "BLOCKED_UNSAFE_OPERATOR_ACTION";
  reason?: string;
  warnings?: string[];
};

const ACTION_ORDER: OperatorAction[] = [
  "ADD_NOTE",
  "REQUEST_VERIFICATION",
  "DISMISS_ADVISORY",
  "ESCALATE_ADVISORY",
  "VIEW_EVIDENCE",
];

function failClosed(reason?: string, warnings: string[] = []): OperatorFailure {
  return {
    ok: false,
    error: OPERATOR_API_ERRORS.BLOCKED_UNSAFE_OPERATOR_ACTION,
    ...(reason ? { reason } : {}),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

function normalizeControllerResult<T>(result: { ok?: unknown; data?: T; error?: unknown; message?: unknown }): OperatorSuccess<T> | OperatorFailure {
  if (result.ok === true) {
    return success(result.data as T);
  }
  return failClosed(String(result.message || result.error || "Controller action failed closed."));
}

function success<T>(data: T): OperatorSuccess<T> {
  return { ok: true, data };
}

function normalizeActor(value: unknown): string {
  const normalized = String(value || "").trim();
  return normalized || "operator";
}

function dedupeWarnings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveAction(actions: OperatorActionResult[], action: OperatorAction): OperatorActionResult {
  return actions.find((entry) => entry.action === action) || { action, allowed: false };
}

export function deriveAllowedActions({
  readModel,
  timeline,
}: {
  readModel: RecoveryReadModel;
  timeline: RecoveryTimeline;
}): OperatorActionResult[] {
  const matchesReadModel = timeline?.meta?.matchesReadModel === true;
  if (!matchesReadModel) {
    return [
      { action: "ADD_NOTE", allowed: true },
      { action: "REQUEST_VERIFICATION", allowed: false, reason: OPERATOR_API_REASONS.TIMELINE_MISMATCH },
      { action: "DISMISS_ADVISORY", allowed: false, reason: OPERATOR_API_REASONS.TIMELINE_MISMATCH },
      { action: "ESCALATE_ADVISORY", allowed: false, reason: OPERATOR_API_REASONS.TIMELINE_MISMATCH },
      { action: "VIEW_EVIDENCE", allowed: true },
    ];
  }

  const actions: OperatorActionResult[] = [];
  actions.push({ action: "ADD_NOTE", allowed: true });

  if (readModel.verification.status === "passed") {
    actions.push({
      action: "REQUEST_VERIFICATION",
      allowed: false,
      reason: OPERATOR_API_REASONS.VERIFICATION_ALREADY_PASSED,
    });
  } else if (readModel.verification.status === "pending") {
    actions.push({
      action: "REQUEST_VERIFICATION",
      allowed: false,
      reason: OPERATOR_API_REASONS.VERIFICATION_ALREADY_RUNNING,
    });
  } else {
    actions.push({ action: "REQUEST_VERIFICATION", allowed: true });
  }

  const advisoryOpen = readModel.advisory.status === "open";
  actions.push(
    advisoryOpen
      ? { action: "DISMISS_ADVISORY", allowed: true }
      : { action: "DISMISS_ADVISORY", allowed: false, reason: OPERATOR_API_REASONS.ADVISORY_NOT_OPEN },
  );
  actions.push(
    advisoryOpen
      ? { action: "ESCALATE_ADVISORY", allowed: true }
      : { action: "ESCALATE_ADVISORY", allowed: false, reason: OPERATOR_API_REASONS.ADVISORY_NOT_OPEN },
  );

  actions.push({ action: "VIEW_EVIDENCE", allowed: true });
  return ACTION_ORDER.map((action) => resolveAction(actions, action));
}

export async function buildOperatorView({
  db,
  executionId,
  nowMs,
  tenantContext,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}): Promise<OperatorSuccess<OperatorView> | OperatorFailure> {
  try {
    const normalizedExecutionId = String(executionId || "").trim();
    if (!normalizedExecutionId) {
      return failClosed();
    }

    const readModelResult = await buildRecoveryReadModel({ db, executionId: normalizedExecutionId, nowMs, tenantContext });
    if (!readModelResult.ok) {
      return failClosed(OPERATOR_API_REASONS.MISSING_READ_MODEL, readModelResult.warnings || []);
    }
    if (readModelResult.data.execution.status === "unknown") {
      return failClosed(OPERATOR_API_REASONS.MISSING_EXECUTION, readModelResult.data.meta.warnings);
    }

    const timelineResult = await buildRecoveryTimeline({ db, executionId: normalizedExecutionId, nowMs, tenantContext });
    if (!timelineResult.ok) {
      return failClosed(OPERATOR_API_REASONS.MISSING_TIMELINE, readModelResult.data.meta.warnings);
    }

    const warnings = dedupeWarnings([
      ...readModelResult.data.meta.warnings,
      ...timelineResult.data.meta.warnings,
    ]);

    return success({
      executionId: normalizedExecutionId,
      readModel: readModelResult.data,
      timeline: timelineResult.data,
      timelineMatchesReadModel: timelineResult.data.meta.matchesReadModel,
      allowedActions: deriveAllowedActions({
        readModel: readModelResult.data,
        timeline: timelineResult.data,
      }),
      warnings,
    });
  } catch {
    return failClosed();
  }
}

export async function addOperatorNote({
  db,
  executionId,
  note,
  notedBy,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  note: string;
  notedBy: string;
  nowMs?: number;
}): Promise<OperatorSuccess<{ noteId: string; executionId: string }> | OperatorFailure> {
  const view = await buildOperatorView({ db, executionId, nowMs });
  if (!view.ok) {
    return view;
  }

  const trimmedNote = String(note || "").trim();
  if (!trimmedNote) {
    return failClosed();
  }

  const entry = appendAuditEvent({
    actor: "operator",
    type: "RECOVERY_OPERATOR_NOTE_ADDED",
    message: `Recovery operator note added for ${view.data.executionId}.`,
    payload: {
      executionId: view.data.executionId,
      note: trimmedNote,
      notedBy: normalizeActor(notedBy),
      nowMs,
    },
  });

  return success({
    noteId: String(entry?.id || ""),
    executionId: view.data.executionId,
  });
}

async function ensureAllowedAction({
  db,
  executionId,
  nowMs,
  action,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  action: OperatorAction;
}) {
  const view = await buildOperatorView({ db, executionId, nowMs });
  if (!view.ok) {
    return view;
  }
  const actionState = resolveAction(view.data.allowedActions, action);
  if (!actionState.allowed) {
    return failClosed(actionState.reason, view.data.warnings);
  }
  return success({
    view: view.data,
    actionState,
  });
}

export async function requestVerificationAction({
  db,
  executionId,
  requestedBy,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  requestedBy: string;
  nowMs?: number;
}): Promise<OperatorSuccess<any> | OperatorFailure> {
  const allowed = await ensureAllowedAction({
    db,
    executionId,
    nowMs,
    action: "REQUEST_VERIFICATION",
  });
  if (!allowed.ok) {
    return allowed;
  }

  const recoveryRequestId = allowed.data.view.readModel.recoveryControl.latestRequestId;
  const payload = {
    executionId: allowed.data.view.executionId,
    recoveryRequestId,
    requestedBy: normalizeActor(requestedBy),
  };

  if (typeof recoveryVerificationController.requestVerification === "function") {
    return normalizeControllerResult(await recoveryVerificationController.requestVerification(payload));
  }

  recoveryVerificationStore.recordVerificationStarted(payload);
  return success({
    queued: true,
    executionId: allowed.data.view.executionId,
    recoveryRequestId,
  });
}

function resolveAdvisoryId(view: OperatorView, advisoryId?: string) {
  const normalized = String(advisoryId || "").trim();
  return normalized || String(view.readModel.advisory.latestAdvisoryId || "").trim();
}

export async function dismissAdvisoryAction({
  db,
  executionId,
  advisoryId,
  dismissedBy,
  reason,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  advisoryId?: string;
  dismissedBy: string;
  reason?: string;
  nowMs?: number;
}): Promise<OperatorSuccess<any> | OperatorFailure> {
  const allowed = await ensureAllowedAction({
    db,
    executionId,
    nowMs,
    action: "DISMISS_ADVISORY",
  });
  if (!allowed.ok) {
    return allowed;
  }

  const resolvedAdvisoryId = resolveAdvisoryId(allowed.data.view, advisoryId);
  if (!resolvedAdvisoryId) {
    return failClosed(OPERATOR_API_REASONS.MISSING_ADVISORY, allowed.data.view.warnings);
  }

  return normalizeControllerResult(await recoveryAdvisoryController.dismissRecoveryAdvisory({
    advisoryId: resolvedAdvisoryId,
    dismissedBy: normalizeActor(dismissedBy),
    reason: String(reason || "").trim() || "dismissed",
  }));
}

export async function escalateAdvisoryAction({
  db,
  executionId,
  advisoryId,
  escalatedBy,
  reason,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  advisoryId?: string;
  escalatedBy: string;
  reason?: string;
  nowMs?: number;
}): Promise<OperatorSuccess<any> | OperatorFailure> {
  const allowed = await ensureAllowedAction({
    db,
    executionId,
    nowMs,
    action: "ESCALATE_ADVISORY",
  });
  if (!allowed.ok) {
    return allowed;
  }

  const resolvedAdvisoryId = resolveAdvisoryId(allowed.data.view, advisoryId);
  if (!resolvedAdvisoryId) {
    return failClosed(OPERATOR_API_REASONS.MISSING_ADVISORY, allowed.data.view.warnings);
  }

  return normalizeControllerResult(await recoveryAdvisoryController.escalateRecoveryAdvisory({
    advisoryId: resolvedAdvisoryId,
    escalatedBy: normalizeActor(escalatedBy),
    reason: String(reason || "").trim() || "escalated",
  }));
}
