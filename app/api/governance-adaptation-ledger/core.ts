import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendGovernanceAdaptationLedger,
  getGovernanceAdaptationLedgerFoundation,
  replayGovernanceAdaptationLedger,
} from "@/services/governance-adaptation-ledger";
import type { GovernanceAdaptationLedgerInput, GovernanceAdaptationLedgerResult } from "@/types/governance-adaptation-ledger";

export async function requireGovernanceAdaptationLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAdaptationLedgerFoundation();
}

export async function appendRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  return appendGovernanceAdaptationLedger(body);
}

export async function entriesRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  return appendGovernanceAdaptationLedger(body).entries;
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  return appendGovernanceAdaptationLedger(body).lineage_graph;
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  return appendGovernanceAdaptationLedger(body).integrity_report;
}

export async function replayIndexRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  return appendGovernanceAdaptationLedger(body).replay_index;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceAdaptationLedgerResult> & GovernanceAdaptationLedgerInput;
  const result = body.entries && body.integrity_report ? body as GovernanceAdaptationLedgerResult : appendGovernanceAdaptationLedger(body);
  return {
    replay_valid: replayGovernanceAdaptationLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.replay_index.replay_refs,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAdaptationLedgerFoundation();
  const body = await readBody(request) as GovernanceAdaptationLedgerInput;
  const result = appendGovernanceAdaptationLedger(body);
  return {
    validation_state: result.validation_state,
    entries: result.entries.length,
    event_types: result.entries.map((entry) => entry.event_type),
    failures: result.integrity_report.failures,
    fail_closed: result.fail_closed,
    append_only: result.append_only,
    immutable: result.immutable,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    audit_ready: result.audit_ready,
    tamper_evident: result.tamper_evident,
    advisory_only: result.advisory_only,
  };
}
