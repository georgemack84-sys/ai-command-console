import { getDeploymentOrchestrationPromotionGovernanceBundle, runDeploymentOrchestrationPromotionGovernance, validateDeploymentOrchestrationPromotionGovernance } from "@/services/deployment-orchestration-promotion-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DeploymentGovernanceInput, DeploymentGovernanceResult } from "@/types/deployment-orchestration-promotion-governance";

export async function requireDeploymentGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): DeploymentGovernanceInput { return body as DeploymentGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): DeploymentGovernanceResult { return (body.result as DeploymentGovernanceResult | undefined) ?? runDeploymentOrchestrationPromotionGovernance(inputFromBody(body)); }

export function contractResponse() { return getDeploymentOrchestrationPromotionGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); }
export async function promotionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); return { promotion_gate: result.promotion_gate, orchestrator: result.orchestrator }; }
export async function stateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); return { identity: result.identity, state_machine: result.state_machine }; }
export async function approvalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); return { approval_workflow: result.approval_workflow, security_authority: result.security_authority }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); return { lineage: result.lineage, ledger: result.ledger, rollback: result.rollback, replay_explainability: result.replay_explainability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runDeploymentOrchestrationPromotionGovernance(); return { observability: result.observability, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateDeploymentOrchestrationPromotionGovernance(resultFromBody(await readBody(request))); }
