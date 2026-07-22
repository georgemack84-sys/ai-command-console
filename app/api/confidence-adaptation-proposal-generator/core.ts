import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  generateConfidenceAdaptationProposal,
  getConfidenceAdaptationProposalFoundation,
  replayConfidenceAdaptationProposal,
} from "@/services/confidence-adaptation-proposal-generator";
import type { ConfidenceAdaptationProposalInput, ConfidenceAdaptationProposalResult } from "@/types/confidence-adaptation-proposal-generator";

export async function requireConfidenceAdaptationProposalUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getConfidenceAdaptationProposalFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  return generateConfidenceAdaptationProposal(body);
}

export async function proposalsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  return generateConfidenceAdaptationProposal(body).proposals;
}

export async function prioritiesRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  return generateConfidenceAdaptationProposal(body).priorities;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  return generateConfidenceAdaptationProposal(body).registry;
}

export async function benefitsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return result.proposals.map((proposal, index) => ({
    proposal_id: proposal.proposal_id,
    expected_improvement: proposal.expected_improvement,
    expected_confidence_gain: proposal.expected_confidence_gain,
    benefit_score: result.priorities[index]?.benefit_score,
  }));
}

export async function risksRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return result.proposals.map((proposal, index) => ({
    proposal_id: proposal.proposal_id,
    risk_category: proposal.risk_category,
    potential_risks: proposal.potential_risks,
    risk_score: result.priorities[index]?.risk_score,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return result.proposals.map((proposal) => ({
    proposal_id: proposal.proposal_id,
    governance_implications: proposal.governance_implications,
    governance_refs: proposal.governance_refs,
    approval_requirements: proposal.approval_requirements,
  }));
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return result.registry_records.map((record) => ({
    proposal_id: record.proposal_id,
    simulation_status: record.simulation_status,
    implementation_status: record.implementation_status,
  }));
}

export async function approvalsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return result.registry_records.map((record) => ({
    proposal_id: record.proposal_id,
    governance_status: record.governance_status,
    approval_status: record.approval_status,
    proposal_status: record.proposal_status,
  }));
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceAdaptationProposalResult> & ConfidenceAdaptationProposalInput;
  const result = body.registry ? body as ConfidenceAdaptationProposalResult : generateConfidenceAdaptationProposal(body);
  return {
    replay_valid: replayConfidenceAdaptationProposal(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.proposals.flatMap((item) => item.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceAdaptationProposalFoundation();
  const body = await readBody(request) as ConfidenceAdaptationProposalInput;
  const result = generateConfidenceAdaptationProposal(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    proposal_type: result.proposals[0]?.proposal_type,
    priority_level: result.priorities[0]?.priority_level,
    advisory_only: result.advisory_only,
    updates_confidence_model: result.updates_confidence_model,
    bypasses_simulation: result.bypasses_simulation,
    bypasses_operator_approval: result.bypasses_operator_approval,
  };
}
