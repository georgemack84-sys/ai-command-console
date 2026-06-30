import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDefaultPolicyGraphInputs,
  buildPolicyDependencyGraph,
  buildPolicyDependencyGraphDoctrine,
  buildPolicyGraphObservabilitySurface,
  buildPolicyGraphSnapshot,
  computePolicyDependencyGraphHash,
  replayPolicyDependencyGraph,
  runPolicyDependencyGraphEngine,
  transitionPolicyDependencyGraphState,
  validatePolicyDependencyGraph,
} from "@/services/policy-dependency-graph";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type { PolicyDependencyGraph, PolicyGraphState } from "@/types/policy-dependency-graph";

export async function requirePolicyGraphUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputsFromBody(body: Record<string, unknown>) {
  const defaults = buildDefaultPolicyGraphInputs();
  return {
    policies: (body.policy_analyses as readonly PolicyAnalysisRecord[] | undefined) ?? defaults.policy_analyses,
    correlations: (body.policy_correlations as readonly PolicyCorrelationRecord[] | undefined) ?? defaults.policy_correlations,
  };
}

export function getPolicyGraphContract() {
  const defaults = buildDefaultPolicyGraphInputs();
  return {
    doctrine: buildPolicyDependencyGraphDoctrine(),
    graph: buildPolicyDependencyGraph(defaults.policy_analyses, defaults.policy_correlations),
  };
}

export async function generatePolicyGraphRequest(request: Request) {
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  return runPolicyDependencyGraphEngine(policies, correlations);
}

export async function validatePolicyGraphRequest(request: Request) {
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  const graph = (body.graph as Partial<PolicyDependencyGraph> | undefined) ?? buildPolicyDependencyGraph(policies, correlations);
  return validatePolicyDependencyGraph(graph);
}

export async function hashPolicyGraphRequest(request: Request) {
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  const graph = (body.graph as PolicyDependencyGraph | undefined) ?? buildPolicyDependencyGraph(policies, correlations);
  return { policy_graph_hash: computePolicyDependencyGraphHash(graph) };
}

export async function transitionPolicyGraphRequest(request: Request) {
  const body = await readBody(request) as { graph?: PolicyDependencyGraph; to_state?: PolicyGraphState };
  const defaults = buildDefaultPolicyGraphInputs();
  const graph = body.graph ?? buildPolicyDependencyGraph(defaults.policy_analyses, defaults.policy_correlations);
  return transitionPolicyDependencyGraphState(graph, body.to_state ?? "ARCHIVED");
}

export async function replayPolicyGraphRequest(request: Request) {
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  const graph = (body.graph as PolicyDependencyGraph | undefined) ?? buildPolicyDependencyGraph(policies, correlations);
  return replayPolicyDependencyGraph(graph);
}

export async function snapshotPolicyGraphRequest(request: Request) {
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  const graph = (body.graph as PolicyDependencyGraph | undefined) ?? buildPolicyDependencyGraph(policies, correlations);
  return buildPolicyGraphSnapshot(graph);
}

export async function inspectPolicyGraphRequest(request?: Request) {
  if (!request) return buildPolicyGraphObservabilitySurface();
  const body = await readBody(request);
  const { policies, correlations } = inputsFromBody(body);
  return buildPolicyGraphObservabilitySurface(policies, correlations);
}
