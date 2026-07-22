import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishMissionMemoryIndex,
  getMissionMemoryIndex,
  replayMissionMemoryIndex,
} from "@/services/mission-memory-index";
import type { MissionMemoryIndexInput, MissionMemoryIndexResult } from "@/types/mission-memory-index";

export async function requireMissionMemoryIndexUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getMissionMemoryIndex();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  return establishMissionMemoryIndex(body);
}

export async function entriesRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  return establishMissionMemoryIndex(body).index_entries;
}

export async function searchRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  return establishMissionMemoryIndex(body).search_results;
}

export async function rankingRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  const result = establishMissionMemoryIndex(body);
  return {
    ranking_inputs: result.ranking_inputs,
    search_results: result.search_results,
    deterministic: result.deterministic,
  };
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  return establishMissionMemoryIndex(body).index_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  return establishMissionMemoryIndex(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<MissionMemoryIndexResult> & MissionMemoryIndexInput;
  const result = body.contract && body.metrics ? (body as MissionMemoryIndexResult) : establishMissionMemoryIndex(body);
  return {
    replay_valid: replayMissionMemoryIndex(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getMissionMemoryIndex();
  const body = (await readBody(request)) as MissionMemoryIndexInput;
  const result = establishMissionMemoryIndex(body);
  return {
    status: result.status,
    failures: result.failures,
    indexed_memories: result.metrics.indexed_memories,
    lookup_latency_ms: result.metrics.lookup_latency_ms,
    retrieval_accuracy: result.metrics.retrieval_accuracy,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    governed_visibility: result.governed_visibility,
    governed_search_ready: result.governed_search_ready,
    store_remains_authoritative: result.store_remains_authoritative,
    discovery_structure_only: result.discovery_structure_only,
    authority_expansion: result.authority_expansion,
  };
}
