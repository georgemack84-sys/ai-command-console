import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  explainAdaptationProposals,
  getProposalExplainabilityFoundation,
  replayProposalExplanations,
} from "@/services/proposal-explainability-engine";
import type { ProposalExplainabilityInput, ProposalExplainabilityResult } from "@/types/proposal-explainability-engine";

export async function requireProposalExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getProposalExplainabilityFoundation();
}

export async function explainRequest(request: Request) {
  const body = await readBody(request) as ProposalExplainabilityInput;
  return explainAdaptationProposals(body);
}

export async function explanationsRequest(request: Request) {
  const body = await readBody(request) as ProposalExplainabilityInput;
  return explainAdaptationProposals(body).explanations;
}

export async function componentsRequest(request: Request) {
  const body = await readBody(request) as ProposalExplainabilityInput;
  return explainAdaptationProposals(body).explanations.flatMap((explanation) => explanation.components);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ProposalExplainabilityInput;
  return explainAdaptationProposals(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ProposalExplainabilityResult> & ProposalExplainabilityInput;
  const result = body.explanations && body.metrics ? body as ProposalExplainabilityResult : explainAdaptationProposals(body);
  return {
    replay_valid: replayProposalExplanations(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    explainability_state: result.explainability_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getProposalExplainabilityFoundation();
  const body = await readBody(request) as ProposalExplainabilityInput;
  const result = explainAdaptationProposals(body);
  return {
    explainability_state: result.explainability_state,
    failures: result.failures,
    explanations: result.explanations.length,
    complete: result.complete,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    evidence_backed: result.evidence_backed,
    governance_aware: result.governance_aware,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    authorizes_implementation: result.authorizes_implementation,
  };
}
