import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getAdaptationPrioritizationFoundation,
  prioritizeAdaptationProposals,
  replayAdaptationPrioritization,
} from "@/services/adaptation-prioritization-engine";
import type { AdaptationPrioritizationInput, AdaptationPrioritizationResult } from "@/types/adaptation-prioritization-engine";

export async function requireAdaptationPrioritizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationPrioritizationFoundation();
}

export async function prioritizeRequest(request: Request) {
  const body = await readBody(request) as AdaptationPrioritizationInput;
  return prioritizeAdaptationProposals(body);
}

export async function prioritiesRequest(request: Request) {
  const body = await readBody(request) as AdaptationPrioritizationInput;
  return prioritizeAdaptationProposals(body).prioritized_proposals;
}

export async function factorsRequest(request: Request) {
  const body = await readBody(request) as AdaptationPrioritizationInput;
  return prioritizeAdaptationProposals(body).prioritized_proposals.flatMap((proposal) => proposal.factor_scores);
}

export async function explanationsRequest(request: Request) {
  const body = await readBody(request) as AdaptationPrioritizationInput;
  return prioritizeAdaptationProposals(body).prioritized_proposals.map((proposal) => proposal.explanation);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationPrioritizationInput;
  return prioritizeAdaptationProposals(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationPrioritizationResult> & AdaptationPrioritizationInput;
  const result = body.prioritized_proposals && body.metrics ? body as AdaptationPrioritizationResult : prioritizeAdaptationProposals(body);
  return {
    replay_valid: replayAdaptationPrioritization(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    prioritization_state: result.prioritization_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationPrioritizationFoundation();
  const body = await readBody(request) as AdaptationPrioritizationInput;
  const result = prioritizeAdaptationProposals(body);
  return {
    prioritization_state: result.prioritization_state,
    failures: result.failures,
    proposals_prioritized: result.prioritized_proposals.length,
    priority_distribution: result.metrics.priority_distribution,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    evidence_validated: result.evidence_validated,
    advisory_only: result.advisory_only,
    approves_proposals: result.approves_proposals,
  };
}
