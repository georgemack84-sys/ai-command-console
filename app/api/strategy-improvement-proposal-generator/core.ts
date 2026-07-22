import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  generateStrategyImprovementProposals,
  getStrategyImprovementProposalFoundation,
  replayStrategyImprovementProposalGeneration,
} from "@/services/strategy-improvement-proposal-generator";
import type { StrategyImprovementProposalInput, StrategyImprovementProposalResult } from "@/types/strategy-improvement-proposal-generator";

export async function requireStrategyImprovementProposalUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategyImprovementProposalFoundation();
}

export async function generateRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body);
}

export async function proposalsRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).proposals;
}

export async function priorityRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).proposals.map((proposal) => ({
    proposal_id: proposal.proposal_id,
    priority_score: proposal.priority_score,
    priority_rank: proposal.priority_rank,
    recommendation: proposal.recommendation,
  }));
}

export async function recommendationRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).proposals.map((proposal) => ({
    proposal_id: proposal.proposal_id,
    recommendation: proposal.recommendation,
    lifecycle_state: proposal.lifecycle_state,
  }));
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).proposals.map((proposal) => ({
    proposal_id: proposal.proposal_id,
    supporting_pattern_refs: proposal.supporting_pattern_refs,
    supporting_outcome_refs: proposal.supporting_outcome_refs,
    supporting_evidence_refs: proposal.supporting_evidence_refs,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).proposals.map((proposal) => ({
    proposal_id: proposal.proposal_id,
    governance_implications: proposal.governance_implications,
    constitutional_implications: proposal.constitutional_implications,
    approval_required: proposal.approval_required,
    certification_required: proposal.certification_required,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategyImprovementProposalResult> & StrategyImprovementProposalInput;
  const result = body.registry ? body as StrategyImprovementProposalResult : generateStrategyImprovementProposals(body);
  return {
    replay_valid: replayStrategyImprovementProposalGeneration(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.proposals.flatMap((proposal) => proposal.replay_refs),
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as StrategyImprovementProposalInput;
  return generateStrategyImprovementProposals(body).registry;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategyImprovementProposalFoundation();
  const body = await readBody(request) as StrategyImprovementProposalInput;
  const result = generateStrategyImprovementProposals(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    proposals: result.proposals.length,
    evidence_backed: result.evidence_backed,
    governance_compliant: result.governance_compliant,
    advisory_only: result.advisory_only,
    direct_approval: result.direct_approval,
  };
}
