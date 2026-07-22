import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getDriftDefenseLedgerFoundation,
  recordDriftDefenseLedger,
  replayDriftDefenseLedger,
} from "@/services/drift-defense-ledger";
import type { DriftDefenseLedgerInput, DriftDefenseLedgerResult } from "@/types/drift-defense-ledger";

export async function requireDriftLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getDriftDefenseLedgerFoundation();
}

export async function recordRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body);
}

export async function schemaRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).schema;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).validation_report;
}

export async function adaptiveRecordRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).adaptive_drift_record;
}

export async function evidenceLineageRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).evidence_lineage;
}

export async function replayRefsRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).replay_references;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).governance_history;
}

export async function certificationRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).certification_history;
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).rollback_history;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).timeline;
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).integrity_report;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).ledger_entry;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseLedgerInput;
  return recordDriftDefenseLedger(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<DriftDefenseLedgerResult> & DriftDefenseLedgerInput;
  const result = body.schema && body.metrics ? body as DriftDefenseLedgerResult : recordDriftDefenseLedger(body);
  return {
    replay_valid: replayDriftDefenseLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getDriftDefenseLedgerFoundation();
  const body = await readBody(request) as DriftDefenseLedgerInput;
  const result = recordDriftDefenseLedger(body);
  return {
    status: result.status,
    failures: result.failures,
    committed: result.metrics.committed,
    append_only: result.metrics.append_only,
    immutable: result.metrics.immutable,
    deterministic: result.deterministic,
    replayable: result.replayable,
    evidence_backed: result.evidence_backed,
    tenant_isolated: result.tenant_isolated,
    integrity_verified: result.metrics.integrity_verified,
    mutates_existing_records: result.mutates_existing_records,
  };
}
