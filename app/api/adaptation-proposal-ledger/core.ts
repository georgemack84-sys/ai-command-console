import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  commitAdaptationProposalLedger,
  getAdaptationProposalLedgerFoundation,
  replayAdaptationProposalLedger,
} from "@/services/adaptation-proposal-ledger";
import type { AdaptationProposalLedgerInput, AdaptationProposalLedgerResult } from "@/types/adaptation-proposal-ledger";

export async function requireAdaptationProposalLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationProposalLedgerFoundation();
}

export async function commitRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalLedgerInput;
  return commitAdaptationProposalLedger(body);
}

export async function entriesRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalLedgerInput;
  return commitAdaptationProposalLedger(body).ledger_entries;
}

export async function queryRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalLedgerInput;
  return commitAdaptationProposalLedger(body).query_index;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalLedgerInput;
  return commitAdaptationProposalLedger(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationProposalLedgerResult> & AdaptationProposalLedgerInput;
  const result = body.ledger_entries && body.metrics ? body as AdaptationProposalLedgerResult : commitAdaptationProposalLedger(body);
  return {
    replay_valid: replayAdaptationProposalLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    ledger_state: result.ledger_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationProposalLedgerFoundation();
  const body = await readBody(request) as AdaptationProposalLedgerInput;
  const result = commitAdaptationProposalLedger(body);
  return {
    ledger_state: result.ledger_state,
    failures: result.failures,
    ledger_entries: result.ledger_entries.length,
    hash_chain_valid: result.hash_chain_valid,
    append_only: result.append_only,
    immutable_storage_verified: result.immutable_storage_verified,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    authorizes_implementation: result.authorizes_implementation,
  };
}
