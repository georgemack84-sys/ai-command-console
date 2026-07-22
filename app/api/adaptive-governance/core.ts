import { getAdaptiveGovernanceBundle, runAdaptiveGovernance, validateAdaptiveGovernance } from "@/services/adaptive-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AdaptiveGovernanceInput, AdaptiveGovernanceResult } from "@/types/adaptive-governance";

export async function requireAdaptiveGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptiveGovernanceInput { return body as AdaptiveGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): AdaptiveGovernanceResult { return (body.result as AdaptiveGovernanceResult | undefined) ?? runAdaptiveGovernance(inputFromBody(body)); }

export function contractResponse() { return getAdaptiveGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { adaptive_governance_engine: result.adaptive_governance_engine, lifecycle: result.lifecycle }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { policy_effectiveness_evaluator: result.policy_effectiveness_evaluator }; }
export async function workloadRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { governance_workload_analyzer: result.governance_workload_analyzer }; }
export async function latencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { approval_latency_analyzer: result.approval_latency_analyzer }; }
export async function complianceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { constitutional_compliance_evaluator: result.constitutional_compliance_evaluator }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { recommendation_engine: result.recommendation_engine, recommendation_registry: result.recommendation_registry }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { evaluation_ledger: result.evaluation_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptiveGovernance(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateAdaptiveGovernance(resultFromBody(await readBody(request))); }
