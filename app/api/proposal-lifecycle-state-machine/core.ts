import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  evaluateProposalLifecycle,
  getProposalLifecycleFoundation,
  replayProposalLifecycle,
} from "@/services/proposal-lifecycle-state-machine";
import type { ProposalLifecycleInput, ProposalLifecycleResult } from "@/types/proposal-lifecycle-state-machine";

export async function requireProposalLifecycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getProposalLifecycleFoundation();
}

export async function evaluateRequest(request: Request) {
  const body = await readBody(request) as ProposalLifecycleInput;
  return evaluateProposalLifecycle(body);
}

export async function transitionsRequest(request: Request) {
  const body = await readBody(request) as ProposalLifecycleInput;
  return evaluateProposalLifecycle(body).transitions;
}

export async function statesRequest(request: Request) {
  const body = await readBody(request) as ProposalLifecycleInput;
  const result = evaluateProposalLifecycle(body);
  return {
    current_states: result.current_states,
    allowed_transitions: result.allowed_transitions,
  };
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ProposalLifecycleInput;
  return evaluateProposalLifecycle(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ProposalLifecycleResult> & ProposalLifecycleInput;
  const result = body.transitions && body.metrics ? body as ProposalLifecycleResult : evaluateProposalLifecycle(body);
  return {
    replay_valid: replayProposalLifecycle(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    state_machine_state: result.state_machine_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getProposalLifecycleFoundation();
  const body = await readBody(request) as ProposalLifecycleInput;
  const result = evaluateProposalLifecycle(body);
  return {
    state_machine_state: result.state_machine_state,
    failures: result.failures,
    transitions: result.transitions.length,
    current_states: result.current_states,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    governance_enforced: result.governance_enforced,
    constitutional_enforced: result.constitutional_enforced,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    authorizes_implementation: result.authorizes_implementation,
  };
}
