import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDefaultPolicyImpactInputs,
  buildPolicyImpactAnalysis,
  buildPolicyImpactDoctrine,
  buildPolicyImpactExplanation,
  buildPolicyImpactObservabilitySurface,
  computePolicyImpactHash,
  replayPolicyImpact,
  runPolicyImpactAnalysisEngine,
  transitionPolicyImpactState,
  validatePolicyImpactAnalysis,
} from "@/services/policy-impact-analysis";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type { PolicyDependencyGraph } from "@/types/policy-dependency-graph";
import type { PolicyImpactAnalysis, PolicyImpactMode, PolicyImpactState } from "@/types/policy-impact-analysis";

export async function requirePolicyImpactUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputsFromBody(body: Record<string, unknown>) {
  const defaults = buildDefaultPolicyImpactInputs();
  return {
    policy: (body.policy_analysis as PolicyAnalysisRecord | undefined) ?? defaults.policy_analysis,
    correlations: (body.policy_correlations as readonly PolicyCorrelationRecord[] | undefined) ?? defaults.policy_correlations,
    graph: (body.policy_graph as PolicyDependencyGraph | undefined) ?? defaults.policy_graph,
    mode: (body.impact_mode as PolicyImpactMode | undefined) ?? "HISTORICAL",
  };
}

export function getPolicyImpactContract() {
  const defaults = buildDefaultPolicyImpactInputs();
  return {
    doctrine: buildPolicyImpactDoctrine(),
    impact: buildPolicyImpactAnalysis(defaults.policy_analysis, defaults.policy_correlations, defaults.policy_graph),
  };
}

export async function analyzePolicyImpactRequest(request: Request) {
  const body = await readBody(request);
  const { policy, correlations, graph, mode } = inputsFromBody(body);
  return runPolicyImpactAnalysisEngine(policy, correlations, graph, mode);
}

export async function validatePolicyImpactRequest(request: Request) {
  const body = await readBody(request);
  const { policy, correlations, graph, mode } = inputsFromBody(body);
  const impact = (body.impact as Partial<PolicyImpactAnalysis> | undefined) ?? buildPolicyImpactAnalysis(policy, correlations, graph, mode);
  return validatePolicyImpactAnalysis(impact, { policy_analysis: policy, policy_correlations: correlations, policy_graph: graph });
}

export async function hashPolicyImpactRequest(request: Request) {
  const body = await readBody(request);
  const { policy, correlations, graph, mode } = inputsFromBody(body);
  const impact = (body.impact as PolicyImpactAnalysis | undefined) ?? buildPolicyImpactAnalysis(policy, correlations, graph, mode);
  return { policy_impact_hash: computePolicyImpactHash(impact) };
}

export async function transitionPolicyImpactRequest(request: Request) {
  const body = await readBody(request) as { impact?: PolicyImpactAnalysis; to_state?: PolicyImpactState };
  const defaults = buildDefaultPolicyImpactInputs();
  const impact = body.impact ?? buildPolicyImpactAnalysis(defaults.policy_analysis, defaults.policy_correlations, defaults.policy_graph);
  return transitionPolicyImpactState(impact, body.to_state ?? "ARCHIVED", defaults);
}

export async function replayPolicyImpactRequest(request: Request) {
  const body = await readBody(request);
  const { policy, correlations, graph, mode } = inputsFromBody(body);
  const impact = (body.impact as PolicyImpactAnalysis | undefined) ?? buildPolicyImpactAnalysis(policy, correlations, graph, mode);
  return replayPolicyImpact(impact, { policy_analysis: policy, policy_correlations: correlations, policy_graph: graph });
}

export async function explainPolicyImpactRequest(request: Request) {
  const body = await readBody(request);
  const { policy, correlations, graph, mode } = inputsFromBody(body);
  const impact = (body.impact as PolicyImpactAnalysis | undefined) ?? buildPolicyImpactAnalysis(policy, correlations, graph, mode);
  return buildPolicyImpactExplanation(impact);
}

export async function inspectPolicyImpactRequest(request?: Request) {
  if (!request) return buildPolicyImpactObservabilitySurface();
  const body = await readBody(request);
  const { policy, correlations, graph } = inputsFromBody(body);
  return buildPolicyImpactObservabilitySurface(policy, correlations, graph);
}
