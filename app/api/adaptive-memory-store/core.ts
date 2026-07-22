import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemoryStore,
  getAdaptiveMemoryStore,
  replayAdaptiveMemoryStore,
} from "@/services/adaptive-memory-store";
import type { AdaptiveMemoryStoreInput, AdaptiveMemoryStoreResult } from "@/types/adaptive-memory-store";

export async function requireAdaptiveMemoryStoreUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemoryStore();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body).storage_engine;
}

export async function identityRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body).identity_registry;
}

export async function integrityRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body).integrity_report;
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body).storage_ledger;
}

export async function retrievalRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  const result = establishAdaptiveMemoryStore(body);
  return {
    governed_retrieval_ready: result.governed_retrieval_ready,
    retrieval_indexes: result.retrieval_indexes,
    unauthorized_read_supported: result.api_surface.unauthorized_read_supported,
    tenant_isolated: result.tenant_isolated,
  };
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  return establishAdaptiveMemoryStore(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemoryStoreResult> & AdaptiveMemoryStoreInput;
  const result = body.contract && body.metrics ? (body as AdaptiveMemoryStoreResult) : establishAdaptiveMemoryStore(body);
  return {
    replay_valid: replayAdaptiveMemoryStore(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemoryStore();
  const body = (await readBody(request)) as AdaptiveMemoryStoreInput;
  const result = establishAdaptiveMemoryStore(body);
  return {
    status: result.status,
    failures: result.failures,
    total_memories_stored: result.metrics.total_memories_stored,
    storage_growth_records: result.metrics.storage_growth_records,
    validation_failures: result.metrics.validation_failures,
    duplicate_rejections: result.metrics.duplicate_rejections,
    replay_success_rate: result.metrics.replay_success_rate,
    deterministic: result.deterministic,
    replayable: result.replayable,
    immutable: result.immutable,
    append_only: result.append_only,
    tenant_isolated: result.tenant_isolated,
    governed_retrieval_ready: result.governed_retrieval_ready,
    encryption_enforced: result.encryption_enforced,
    unauthorized_mutation_prevented: result.unauthorized_mutation_prevented,
    system_of_record: result.system_of_record,
    autonomous_learning_repository: result.autonomous_learning_repository,
  };
}
