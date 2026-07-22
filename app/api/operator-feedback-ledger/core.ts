import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendOperatorFeedbackLedger,
  getOperatorFeedbackLedgerFoundation,
  replayOperatorFeedbackLedger,
} from "@/services/operator-feedback-ledger";
import type { OperatorFeedbackLedgerInput, OperatorFeedbackLedgerResult } from "@/types/operator-feedback-ledger";

export async function requireOperatorFeedbackLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOperatorFeedbackLedgerFoundation();
}

export async function appendRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).records;
}

export async function replayLedgerRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).replay_ledger;
}

export async function approvalHistoryRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).approval_history;
}

export async function overrideHistoryRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).override_history;
}

export async function rejectionHistoryRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).rejection_history;
}

export async function evidenceHistoryRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).evidence_history;
}

export async function adaptationUsageRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).adaptation_usage;
}

export async function simulationUsageRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).simulation_usage;
}

export async function certificationLineageRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).certification_lineage;
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).integrity_report;
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  return appendOperatorFeedbackLedger(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<OperatorFeedbackLedgerResult> & OperatorFeedbackLedgerInput;
  const result = body.records && body.replay_ledger ? body as OperatorFeedbackLedgerResult : appendOperatorFeedbackLedger(body);
  return {
    replay_valid: replayOperatorFeedbackLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    ledger_state: result.ledger_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOperatorFeedbackLedgerFoundation();
  const body = await readBody(request) as OperatorFeedbackLedgerInput;
  const result = appendOperatorFeedbackLedger(body);
  return {
    ledger_state: result.ledger_state,
    record_count: result.records.length,
    failures: result.failures,
    replayable: result.replayable,
    append_only: result.append_only,
    immutable: result.immutable,
    tenant_isolated: result.tenant_isolated,
    authoritative_system_of_record: result.authoritative_system_of_record,
    history_only: result.history_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}
