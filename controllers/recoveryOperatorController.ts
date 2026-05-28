import {
  addOperatorNote,
  buildOperatorView,
  dismissAdvisoryAction,
  escalateAdvisoryAction,
  requestVerificationAction,
} from "../services/recovery/recoveryOperatorActions";
import type { TenantContext } from "../services/tenancy/tenantTypes";

export async function getRecoveryOperatorReadModel(input: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}) {
  const view = await buildOperatorView(input);
  if (!view.ok) {
    return view;
  }
  return {
    ok: true as const,
    data: view.data.readModel,
  };
}

export async function getRecoveryOperatorTimeline(input: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}) {
  const view = await buildOperatorView(input);
  if (!view.ok) {
    return view;
  }
  return {
    ok: true as const,
    data: view.data.timeline,
  };
}

export function getRecoveryOperatorView(input: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
  tenantContext?: TenantContext;
}) {
  return buildOperatorView(input);
}

export function addRecoveryOperatorNote(input: {
  db?: unknown;
  executionId: string;
  note: string;
  notedBy: string;
  nowMs?: number;
}) {
  return addOperatorNote(input);
}

export function requestRecoveryOperatorVerification(input: {
  db?: unknown;
  executionId: string;
  requestedBy: string;
  nowMs?: number;
}) {
  return requestVerificationAction(input);
}

export function dismissRecoveryOperatorAdvisory(input: {
  db?: unknown;
  executionId: string;
  advisoryId?: string;
  dismissedBy: string;
  reason?: string;
  nowMs?: number;
}) {
  return dismissAdvisoryAction(input);
}

export function escalateRecoveryOperatorAdvisory(input: {
  db?: unknown;
  executionId: string;
  advisoryId?: string;
  escalatedBy: string;
  reason?: string;
  nowMs?: number;
}) {
  return escalateAdvisoryAction(input);
}
