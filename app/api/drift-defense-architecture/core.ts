import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishDriftDefenseArchitecture,
  getDriftDefenseArchitectureFoundation,
  replayDriftDefenseArchitecture,
} from "@/services/drift-defense-architecture";
import type { DriftDefenseArchitectureResult, DriftDefenseInput } from "@/types/drift-defense-architecture";

export async function requireDriftDefenseUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getDriftDefenseArchitectureFoundation();
}

export async function establishRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  return establishDriftDefenseArchitecture(body);
}

export async function taxonomyRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  return establishDriftDefenseArchitecture(body).taxonomy;
}

export async function policiesRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  return establishDriftDefenseArchitecture(body).response_policies;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  const result = establishDriftDefenseArchitecture(body);
  return { containment_levels: result.containment_levels, response_policies: result.response_policies };
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  const result = establishDriftDefenseArchitecture(body);
  return { escalation_triggers: result.escalation_triggers, escalation_destinations: result.escalation_destinations };
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as DriftDefenseInput;
  return establishDriftDefenseArchitecture(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<DriftDefenseArchitectureResult> & DriftDefenseInput;
  const result = body.contract && body.metrics ? body as DriftDefenseArchitectureResult : establishDriftDefenseArchitecture(body);
  return {
    replay_valid: replayDriftDefenseArchitecture(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getDriftDefenseArchitectureFoundation();
  const body = await readBody(request) as DriftDefenseInput;
  const result = establishDriftDefenseArchitecture(body);
  return {
    status: result.status,
    failures: result.failures,
    supported_drift_types_count: result.metrics.supported_drift_types_count,
    severity_levels_count: result.metrics.severity_levels_count,
    response_policies_count: result.metrics.response_policies_count,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    authorizes_production_response: result.authorizes_production_response,
  };
}
