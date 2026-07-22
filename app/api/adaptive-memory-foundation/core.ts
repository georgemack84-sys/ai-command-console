import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  establishAdaptiveMemoryFoundation,
  getAdaptiveMemoryFoundation,
  replayAdaptiveMemoryFoundation,
} from "@/services/adaptive-memory-foundation";
import type { AdaptiveMemoryFoundationResult, AdaptiveMemoryInput } from "@/types/adaptive-memory-foundation";

export async function requireAdaptiveMemoryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveMemoryFoundation();
}

export async function establishRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  return establishAdaptiveMemoryFoundation(body);
}

export async function lifecycleRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  return establishAdaptiveMemoryFoundation(body).lifecycle;
}

export async function classificationsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  return establishAdaptiveMemoryFoundation(body).classification_taxonomy;
}

export async function permissionsRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  return establishAdaptiveMemoryFoundation(body).permission_registry;
}

export async function governanceRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  const result = establishAdaptiveMemoryFoundation(body);
  return {
    governance_validation: result.governance_validation,
    reuse_rules: result.reuse_rules,
    prohibited_behaviors: result.prohibited_behaviors,
  };
}

export async function ledgerRequest(request: Request) {
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  return establishAdaptiveMemoryFoundation(body).foundation_ledger;
}

export async function replayRequest(request: Request) {
  const body = (await readBody(request)) as Partial<AdaptiveMemoryFoundationResult> & AdaptiveMemoryInput;
  const result = body.contract && body.metrics ? (body as AdaptiveMemoryFoundationResult) : establishAdaptiveMemoryFoundation(body);
  return {
    replay_valid: replayAdaptiveMemoryFoundation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveMemoryFoundation();
  const body = (await readBody(request)) as AdaptiveMemoryInput;
  const result = establishAdaptiveMemoryFoundation(body);
  return {
    status: result.status,
    failures: result.failures,
    lifecycle_stage_count: result.metrics.lifecycle_stage_count,
    classification_count: result.metrics.classification_count,
    owner_count: result.metrics.owner_count,
    ledger_entry_count: result.metrics.ledger_entry_count,
    active_memory_count: result.metrics.active_memory_count,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_visibility_preserved: result.operator_visibility_preserved,
    tenant_isolated: result.tenant_isolated,
    immutable_lineage: result.immutable_lineage,
    advisory_only: result.advisory_only,
    authorizes_actions: result.authorizes_actions,
    authorizes_production_mutation: result.authorizes_production_mutation,
    authorizes_governance_override: result.authorizes_governance_override,
  };
}
