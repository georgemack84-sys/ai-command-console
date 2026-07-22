import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemoryReplayEngine,
  getAdaptiveMemoryReplayEngine,
  replayAdaptiveMemoryReplayEngine,
} from "@/services/adaptive-memory-replay-engine";
import type { AdaptiveMemoryReplayInput, AdaptiveMemoryReplayResult, MemoryReplayRecord } from "@/types/adaptive-memory-replay-engine";

export async function requireAdaptiveMemoryReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemoryReplayEngine();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body).replay_records;
}

export async function lineageRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body).replay_records.map((record: MemoryReplayRecord) => ({
    replay_id: record.replay_id,
    memory_id: record.memory_id,
    tenant_id: record.tenant_id,
    lineage_refs: record.lineage_refs,
    evidence_refs: record.evidence_refs,
    governance_refs: record.governance_refs,
    certification_refs: record.certification_refs,
  }));
}

export async function validationRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body).replay_records.map((record: MemoryReplayRecord) => ({
    replay_id: record.replay_id,
    replay_status: record.replay_status,
    validators: record.validators,
  }));
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body).replay_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  return establishAdaptiveMemoryReplayEngine(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemoryReplayResult> & AdaptiveMemoryReplayInput;
  const result = body.contract && body.metrics ? (body as AdaptiveMemoryReplayResult) : establishAdaptiveMemoryReplayEngine(body);
  return {
    replay_valid: replayAdaptiveMemoryReplayEngine(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemoryReplayEngine();
  const body = (await readBody(request)) as AdaptiveMemoryReplayInput;
  const result = establishAdaptiveMemoryReplayEngine(body);
  return {
    status: result.status,
    failures: result.failures,
    replay_requests: result.metrics.replay_requests,
    replay_failures: result.metrics.replay_failures,
    replay_success_rate: result.metrics.replay_success_rate,
    deterministic: result.deterministic,
    replayable: result.replayable,
    historical_fidelity_preserved: result.historical_fidelity_preserved,
    evidence_provenance_preserved: result.evidence_provenance_preserved,
    governance_preserved: result.governance_preserved,
    tenant_isolation_enforced: result.tenant_isolation_enforced,
    advisory_only: result.advisory_only,
  };
}
