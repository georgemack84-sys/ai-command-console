import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemoryLedger,
  getAdaptiveMemoryLedger,
  replayAdaptiveMemoryLedger,
} from "@/services/adaptive-memory-ledger";
import type { AdaptiveMemoryLedgerInput, AdaptiveMemoryLedgerResult } from "@/types/adaptive-memory-ledger";

export async function requireAdaptiveMemoryLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemoryLedger();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryLedgerInput;
  return establishAdaptiveMemoryLedger(body);
}

export async function sectionRequest(
  request: Request,
  key: "ledger_records" | "lineage_records" | "audit_report" | "integrity_validation" | "metrics",
) {
  const body = (await readBody(request)) as AdaptiveMemoryLedgerInput;
  return establishAdaptiveMemoryLedger(body)[key];
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemoryLedgerResult> & AdaptiveMemoryLedgerInput;
  const result = body.contract && body.metrics ? (body as AdaptiveMemoryLedgerResult) : establishAdaptiveMemoryLedger(body);
  return {
    replay_valid: replayAdaptiveMemoryLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemoryLedger();
  const body = (await readBody(request)) as AdaptiveMemoryLedgerInput;
  const result = establishAdaptiveMemoryLedger(body);
  return {
    status: result.status,
    failures: result.failures,
    ledger_writes: result.metrics.ledger_writes,
    chain_validation_failures: result.metrics.chain_validation_failures,
    deterministic: result.deterministic,
    replayable: result.replayable,
    append_only: result.append_only,
    immutable: result.immutable,
    hash_chain_valid: result.hash_chain_valid,
    lineage_complete: result.lineage_complete,
    governance_history_preserved: result.governance_history_preserved,
    tenant_isolation_enforced: result.tenant_isolation_enforced,
  };
}
