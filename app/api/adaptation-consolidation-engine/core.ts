import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  consolidateAdaptationProposals,
  getAdaptationConsolidationFoundation,
  replayAdaptationConsolidation,
} from "@/services/adaptation-consolidation-engine";
import type { AdaptationConsolidationInput, AdaptationConsolidationResult } from "@/types/adaptation-consolidation-engine";

export async function requireAdaptationConsolidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationConsolidationFoundation();
}

export async function consolidateRequest(request: Request) {
  const body = await readBody(request) as AdaptationConsolidationInput;
  return consolidateAdaptationProposals(body);
}

export async function groupsRequest(request: Request) {
  const body = await readBody(request) as AdaptationConsolidationInput;
  return consolidateAdaptationProposals(body).consolidated_proposals;
}

export async function relationshipsRequest(request: Request) {
  const body = await readBody(request) as AdaptationConsolidationInput;
  return consolidateAdaptationProposals(body).relationships;
}

export async function explanationsRequest(request: Request) {
  const body = await readBody(request) as AdaptationConsolidationInput;
  return consolidateAdaptationProposals(body).consolidated_proposals.map((proposal) => proposal.explanation);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationConsolidationInput;
  return consolidateAdaptationProposals(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationConsolidationResult> & AdaptationConsolidationInput;
  const result = body.consolidated_proposals && body.metrics ? body as AdaptationConsolidationResult : consolidateAdaptationProposals(body);
  return {
    replay_valid: replayAdaptationConsolidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    consolidation_state: result.consolidation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationConsolidationFoundation();
  const body = await readBody(request) as AdaptationConsolidationInput;
  const result = consolidateAdaptationProposals(body);
  return {
    consolidation_state: result.consolidation_state,
    failures: result.failures,
    candidates: result.candidates.length,
    relationships: result.relationships.map((relationship) => relationship.relationship_type),
    consolidated_proposals: result.consolidated_proposals.length,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    approves_proposals: result.approves_proposals,
  };
}
