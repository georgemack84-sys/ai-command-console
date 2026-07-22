import {
  buildAuthorityGraph,
  buildEvidenceChain,
  buildExplanationGraph,
  buildPolicyInfluenceGraph,
  buildReasoningGraphObservabilitySurface,
  getReasoningGraph,
  getReasoningGraphContract,
  queryReasoningGraph,
  registerEvidence,
  replayReasoningGraph,
  validateReasoningGraph,
} from "@/services/evidence-policy-reasoning-graph";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReasoningGraphInput, ReasoningGraphQueryCriteria, ReasoningGraphRepository } from "@/types/evidence-policy-reasoning-graph";

export async function requireReasoningGraphUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ReasoningGraphRepository {
  return (body.repository as ReasoningGraphRepository | undefined) ?? buildExplanationGraph(body as ReasoningGraphInput);
}

export function contractResponse() { return getReasoningGraphContract(); }
export async function registerEvidenceRequest(request: Request) { return registerEvidence((await readBody(request)) as ReasoningGraphInput); }
export async function evidenceChainRequest(request: Request) { return buildEvidenceChain((await readBody(request)) as ReasoningGraphInput); }
export async function policyGraphRequest(request: Request) { return buildPolicyInfluenceGraph((await readBody(request)) as ReasoningGraphInput); }
export async function authorityGraphRequest(request: Request) { return buildAuthorityGraph((await readBody(request)) as ReasoningGraphInput); }
export async function explanationGraphRequest(request: Request) { return buildExplanationGraph((await readBody(request)) as ReasoningGraphInput); }
export async function replayRequest(request: Request) {
  const body = await readBody(request);
  return replayReasoningGraph(getReasoningGraph(repositoryFromBody(body), body.graph_id as string | undefined));
}
export async function queryRequest(request: Request) {
  const body = await readBody(request);
  return queryReasoningGraph((body.criteria as ReasoningGraphQueryCriteria | undefined) ?? body, repositoryFromBody(body));
}
export async function validateRequest(request: Request) {
  const body = await readBody(request);
  return validateReasoningGraph(getReasoningGraph(repositoryFromBody(body), body.graph_id as string | undefined));
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildReasoningGraphObservabilitySurface();
  return buildReasoningGraphObservabilitySurface(repositoryFromBody(await readBody(request)));
}
