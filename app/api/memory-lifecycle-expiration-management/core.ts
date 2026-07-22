import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishMemoryLifecycleExpirationManagement,
  getMemoryLifecycleExpirationManagement,
  replayMemoryLifecycleExpirationManagement,
} from "@/services/memory-lifecycle-expiration-management";
import type { MemoryLifecycleInput, MemoryLifecycleRecord, MemoryLifecycleResult } from "@/types/memory-lifecycle-expiration-management";

export async function requireMemoryLifecycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getMemoryLifecycleExpirationManagement();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as MemoryLifecycleInput;
  return establishMemoryLifecycleExpirationManagement(body);
}

export async function recordsRequest(request: Request) {
  const body = (await readBody(request)) as MemoryLifecycleInput;
  return establishMemoryLifecycleExpirationManagement(body).lifecycle_records;
}

export async function policyRequest(request: Request, key: "retention_policy" | "expiration_policy") {
  const body = (await readBody(request)) as MemoryLifecycleInput;
  return establishMemoryLifecycleExpirationManagement(body).lifecycle_records.map((record: MemoryLifecycleRecord) => ({
    lifecycle_id: record.lifecycle_id,
    memory_id: record.memory_id,
    policy: record[key],
  }));
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as MemoryLifecycleInput;
  return establishMemoryLifecycleExpirationManagement(body).lifecycle_ledger;
}

export async function metricsRequest(request: Request) {
  const body = (await readBody(request)) as MemoryLifecycleInput;
  return establishMemoryLifecycleExpirationManagement(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<MemoryLifecycleResult> & MemoryLifecycleInput;
  const result = body.contract && body.metrics ? (body as MemoryLifecycleResult) : establishMemoryLifecycleExpirationManagement(body);
  return {
    replay_valid: replayMemoryLifecycleExpirationManagement(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getMemoryLifecycleExpirationManagement();
  const body = (await readBody(request)) as MemoryLifecycleInput;
  const result = establishMemoryLifecycleExpirationManagement(body);
  return {
    status: result.status,
    failures: result.failures,
    lifecycle_transitions: result.metrics.lifecycle_transitions,
    transition_failures: result.metrics.transition_failures,
    policy_violations: result.metrics.policy_violations,
    deterministic: result.deterministic,
    replayable: result.replayable,
    governance_enforced: result.governance_enforced,
    historical_traceability_preserved: result.historical_traceability_preserved,
    replay_continuity_preserved: result.replay_continuity_preserved,
    tenant_isolation_enforced: result.tenant_isolation_enforced,
    historical_deletion_prevented: result.historical_deletion_prevented,
  };
}
