import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getStrategyEvolutionLedgerFoundation,
  recordStrategyEvolutionLedger,
  replayStrategyEvolutionLedger,
} from "@/services/strategy-evolution-ledger";
import type { StrategyEvolutionLedgerInput, StrategyEvolutionLedgerResult } from "@/types/strategy-evolution-ledger";

export async function requireStrategyEvolutionLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategyEvolutionLedgerFoundation();
}

export async function recordRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body).records;
}

export async function versionsRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body).records.map((record) => ({
    proposal_id: record.proposal_id,
    proposal_version: record.proposal_version,
    parent_version_ref: record.parent_version_ref,
    superseded_by_ref: record.superseded_by_ref,
  }));
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body).records.map((record) => ({
    ledger_record_id: record.ledger_record_id,
    proposal_id: record.proposal_id,
    lineage_refs: record.lineage_refs,
    supporting_proposal_refs: record.supporting_proposal_refs,
  }));
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  const result = recordStrategyEvolutionLedger(body);
  return {
    certified: result.validation.certified,
    integrity_verified: result.validation.integrity_verified,
    previous_hash_verified: result.validation.previous_hash_verified,
    failures: result.validation.failures,
  };
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategyEvolutionLedgerResult> & StrategyEvolutionLedgerInput;
  const result = body.registry ? body as StrategyEvolutionLedgerResult : recordStrategyEvolutionLedger(body);
  return {
    replay_valid: replayStrategyEvolutionLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body).records.map((record) => ({
    ledger_record_id: record.ledger_record_id,
    rollback_refs: record.rollback_refs,
  }));
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  return recordStrategyEvolutionLedger(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategyEvolutionLedgerFoundation();
  const body = await readBody(request) as StrategyEvolutionLedgerInput;
  const result = recordStrategyEvolutionLedger(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    records: result.records.length,
    append_only: result.append_only,
    immutable: result.immutable,
    tenant_isolated: result.tenant_isolated,
  };
}
