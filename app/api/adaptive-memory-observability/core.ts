import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemoryObservability,
  getAdaptiveMemoryObservability,
  replayAdaptiveMemoryObservability,
} from "@/services/adaptive-memory-observability";
import type { AdaptiveMemoryObservabilityInput, AdaptiveMemoryObservabilityResult } from "@/types/adaptive-memory-observability";

export async function requireAdaptiveMemoryObservabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemoryObservability();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryObservabilityInput;
  return establishAdaptiveMemoryObservability(body);
}

export async function sectionRequest(
  request: Request,
  key:
    | "metrics"
    | "retrieval_analytics"
    | "reuse_analytics"
    | "governance_dashboard"
    | "replay_observability"
    | "similarity_observability"
    | "health"
    | "alerts"
    | "observability_ledger",
) {
  const body = (await readBody(request)) as AdaptiveMemoryObservabilityInput;
  return establishAdaptiveMemoryObservability(body)[key];
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemoryObservabilityResult> & AdaptiveMemoryObservabilityInput;
  const result = body.contract && body.operational_metrics ? (body as AdaptiveMemoryObservabilityResult) : establishAdaptiveMemoryObservability(body);
  return {
    replay_valid: replayAdaptiveMemoryObservability(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemoryObservability();
  const body = (await readBody(request)) as AdaptiveMemoryObservabilityInput;
  const result = establishAdaptiveMemoryObservability(body);
  return {
    status: result.status,
    failures: result.failures,
    health: result.health.overall_health,
    alert_count: result.alerts.length,
    deterministic: result.deterministic,
    replayable: result.replayable,
    telemetry_complete: result.telemetry_complete,
    dashboard_consistent: result.dashboard_consistent,
    tenant_isolation_preserved: result.tenant_isolation_preserved,
    privacy_preserved: result.privacy_preserved,
    execution_influence_prevented: result.execution_influence_prevented,
  };
}
