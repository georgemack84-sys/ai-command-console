import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  generateAdaptationProposals,
  getAdaptationProposalGeneratorFoundation,
  replayAdaptationProposalGeneration,
} from "@/services/adaptation-proposal-generator";
import type { AdaptationProposalGeneratorInput, AdaptationProposalGeneratorResult } from "@/types/adaptation-proposal-generator";

export async function requireAdaptationProposalGeneratorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationProposalGeneratorFoundation();
}

export async function generateRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalGeneratorInput;
  return generateAdaptationProposals(body);
}

export async function proposalsRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalGeneratorInput;
  return generateAdaptationProposals(body).generated_proposals;
}

export async function classificationsRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalGeneratorInput;
  return generateAdaptationProposals(body).generated_proposals.map((proposal) => ({
    generated_proposal_id: proposal.generated_proposal_id,
    categories: proposal.categories,
    opportunity_id: proposal.opportunity_id,
    adaptation_type: proposal.contract_result.proposal.adaptation_type,
  }));
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalGeneratorInput;
  return generateAdaptationProposals(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationProposalGeneratorResult> & AdaptationProposalGeneratorInput;
  const result = body.generated_proposals && body.metrics ? body as AdaptationProposalGeneratorResult : generateAdaptationProposals(body);
  return {
    replay_valid: replayAdaptationProposalGeneration(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    generation_state: result.generation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationProposalGeneratorFoundation();
  const body = await readBody(request) as AdaptationProposalGeneratorInput;
  const result = generateAdaptationProposals(body);
  return {
    generation_state: result.generation_state,
    failures: result.failures,
    proposals_generated: result.generated_proposals.length,
    opportunities: result.opportunities.length,
    replayable: result.replayable,
    evidence_backed: result.evidence_backed,
    tenant_isolated: result.tenant_isolated,
    governance_enforced: result.governance_enforced,
    advisory_only: result.advisory_only,
    mutates_production: result.mutates_production,
  };
}
