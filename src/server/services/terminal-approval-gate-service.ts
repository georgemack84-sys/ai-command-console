import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { AppError } from "@/src/server/api/errors";
import type { SessionUser } from "@/src/lib/types";
import {
  assertTerminalEnvironmentBoundary,
  normalizeOperationalEnvironment,
  requireOperationalEnvironment,
} from "@/src/server/services/terminal-environment-boundary-service";

const require = createRequire(import.meta.url);
const {
  createApprovalRequest,
  getApprovalRequest,
  loadCollaborationState,
  resolveApprovalRequest,
  updateApprovalRequest,
} = require("../../../services/collaboration");
const { appendAuditEvent } = require("../../../services/auditTrail");
const { canApproveInEnvironment } = require("../../../services/permissions");

type ApprovalActor = Pick<SessionUser, "id" | "workspaceId" | "name" | "email" | "role">;

export type SensitiveApprovalRequest = {
  id: string;
  kind: "terminal-sensitive-action";
  workspaceId: string;
  environment: string;
  action: string;
  payload: Record<string, unknown>;
  label: string;
  approverTarget: string;
  requestedById: string;
  requestedByName: string;
  requestedByEmail: string;
  requestedByRole: SessionUser["role"];
  requiredRole: string;
  risk: string;
  requestKey: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  approvedById?: string;
  approvedByName?: string;
  rejectedById?: string;
  rejectedByName?: string;
  rejectionNote?: string;
};

const SENSITIVE_ACTION_LABELS = new Map<string, string>([
  ["job:cancel", "Cancel background job"],
  ["watcher:stop", "Stop the watcher"],
  ["watcher:rule-delete", "Delete watcher rule"],
  ["alert:resolve", "Resolve active alert"],
  ["agent:update-config", "Change agent runtime configuration"],
  ["policy:update-thresholds", "Change alert thresholds"],
  ["policy:update-automation", "Change automation policy"],
  ["automation-template:delete", "Delete automation template"],
  ["collaboration:update-governance", "Change collaboration governance"],
  ["collaboration:delete-policy-playbook", "Delete policy playbook"],
  ["collaboration:rollback-approval-policy", "Roll back approval policy"],
  ["collaboration:archive-session", "Archive shared session"],
  ["collaboration:archive-shared-macro", "Archive shared macro"],
  ["collaboration:close-handoff", "Close operator handoff"],
  ["ownership:release-item", "Release work ownership"],
  ["ownership:assign-item", "Reassign work ownership"],
]);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function buildRequestKey(
  workspaceId: string,
  environment: string,
  actorId: string,
  action: string,
  payload: Record<string, unknown>,
) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue({ workspaceId, environment, actorId, action, payload })))
    .digest("hex");
}

function isSensitiveRequest(value: unknown): value is SensitiveApprovalRequest {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).kind === "terminal-sensitive-action",
  );
}

export function isSensitiveTerminalAction(action: string) {
  return SENSITIVE_ACTION_LABELS.has(String(action || ""));
}

export function listSensitiveApprovalRequests(workspaceId: string, environment?: string): SensitiveApprovalRequest[] {
  const state = loadCollaborationState();
  const normalizedEnvironment = environment ? normalizeOperationalEnvironment(environment) : null;
  return (Array.isArray(state.approvals) ? state.approvals : [])
    .filter(
      (request: unknown): request is SensitiveApprovalRequest =>
        isSensitiveRequest(request) &&
        request.workspaceId === workspaceId &&
        (!normalizedEnvironment || normalizeOperationalEnvironment(request.environment) === normalizedEnvironment),
    )
    .sort((left: SensitiveApprovalRequest, right: SensitiveApprovalRequest) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export function getSensitiveApprovalRequest(approvalId: string, workspaceId: string) {
  const request = getApprovalRequest(approvalId);
  return isSensitiveRequest(request) && request.workspaceId === workspaceId ? request : null;
}

export function requestSensitiveActionApproval(input: {
  action: string;
  payload: Record<string, unknown>;
  actor: ApprovalActor;
  environment: string;
}) {
  if (!isSensitiveTerminalAction(input.action)) {
    throw new AppError(400, "approval_gate_action_not_sensitive", `Action ${input.action} is not configured as sensitive.`);
  }
  if (input.actor.role === "viewer") {
    throw new AppError(403, "approval_gate_forbidden", "Viewer accounts cannot request sensitive actions.");
  }

  const environment = requireOperationalEnvironment(input.environment);
  const requestKey = buildRequestKey(input.actor.workspaceId, environment, input.actor.id, input.action, input.payload);
  const existing = listSensitiveApprovalRequests(input.actor.workspaceId, environment).find(
    (request: SensitiveApprovalRequest) => request.status === "pending" && request.requestKey === requestKey,
  );
  if (existing) {
    return { request: existing, created: false };
  }

  const request = createApprovalRequest({
    kind: "terminal-sensitive-action",
    workspaceId: input.actor.workspaceId,
    environment,
    action: input.action,
    payload: input.payload,
    label: SENSITIVE_ACTION_LABELS.get(input.action) || input.action,
    approverTarget: "role:approver,role:admin",
    requiredRole: "approver",
    risk: "sensitive",
    requestKey,
    requestedById: input.actor.id,
    requestedByName: input.actor.name || input.actor.email,
    requestedByEmail: input.actor.email,
    requestedByRole: input.actor.role,
  }) as SensitiveApprovalRequest;

  appendAuditEvent({
    type: "approval:requested",
    message: `Queued two-person approval for ${input.action}.`,
    payload: {
      approvalId: request.id,
      actorId: input.actor.id,
      workspaceId: input.actor.workspaceId,
      environment,
      action: input.action,
    },
  });
  return { request, created: true };
}

function requirePendingDecision(approvalId: string, actor: ApprovalActor, governance: Record<string, unknown>) {
  const request = getSensitiveApprovalRequest(approvalId, actor.workspaceId);
  if (!request) {
    throw new AppError(404, "sensitive_approval_not_found", "Sensitive action approval request not found.");
  }
  if (request.status !== "pending") {
    throw new AppError(409, "sensitive_approval_resolved", `Approval request is already ${request.status}.`);
  }
  if (request.requestedById === actor.id) {
    throw new AppError(403, "sensitive_approval_self_decision", "The requester cannot approve or reject their own sensitive action.");
  }
  if (!canApproveInEnvironment(actor.role, governance, actor.workspaceId)) {
    throw new AppError(403, "sensitive_approval_forbidden", "An approver or admin must decide this sensitive action.");
  }
  assertTerminalEnvironmentBoundary({
    action: request.action,
    payload: request.payload,
    workspaceId: actor.workspaceId,
    governance,
    approvedEnvironment: request.environment,
  });
  return request;
}

export function rejectSensitiveActionApproval(input: {
  approvalId: string;
  note?: string;
  actor: ApprovalActor;
  governance: Record<string, unknown>;
}) {
  const request = requirePendingDecision(input.approvalId, input.actor, input.governance);
  const note = String(input.note || "").trim();
  const resolved = resolveApprovalRequest(request.id, {
    status: "rejected",
    rejectedById: input.actor.id,
    rejectedByName: input.actor.name || input.actor.email,
    rejectionNote: note,
  }) as SensitiveApprovalRequest;
  appendAuditEvent({
    type: "approval:reject",
    message: `Rejected sensitive action request ${request.id}.`,
    summary: note,
    payload: { approvalId: request.id, actorId: input.actor.id, workspaceId: input.actor.workspaceId, action: request.action },
  });
  return resolved;
}

export async function approveSensitiveActionApproval<T extends { ok?: boolean; error?: string; output?: unknown }>(input: {
  approvalId: string;
  actor: ApprovalActor;
  governance: Record<string, unknown>;
  execute: (request: SensitiveApprovalRequest) => Promise<T>;
}) {
  const request = requirePendingDecision(input.approvalId, input.actor, input.governance);
  const result = await input.execute(request);
  if (result.ok === false) {
    updateApprovalRequest(request.id, {
      lastExecutionAttemptAt: new Date().toISOString(),
      lastExecutionError: result.error || "Approved action execution failed.",
    });
    throw new AppError(409, "sensitive_approval_execution_failed", result.error || "Approved action execution failed.");
  }

  const resolved = resolveApprovalRequest(request.id, {
    status: "approved",
    approvedById: input.actor.id,
    approvedByName: input.actor.name || input.actor.email,
    executedAt: new Date().toISOString(),
  }) as SensitiveApprovalRequest;
  appendAuditEvent({
    type: "approval:approve",
    message: `Approved and executed sensitive action request ${request.id}.`,
    payload: { approvalId: request.id, actorId: input.actor.id, workspaceId: input.actor.workspaceId, action: request.action },
  });
  return { request: resolved, result };
}
