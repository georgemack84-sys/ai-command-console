import { getRecommendationCycleManagementContract, runRecommendationCycleManagement, validateRecommendationCycleManagement } from "@/services/recommendation-cycle-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RecommendationCycleInput, RecommendationCycleResult } from "@/types/recommendation-cycle-management";

export async function requireRecommendationCycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RecommendationCycleInput { return body as RecommendationCycleInput; }
function resultFromBody(body: Record<string, unknown>): RecommendationCycleResult { return (body.result as RecommendationCycleResult | undefined) ?? runRecommendationCycleManagement(inputFromBody(body)); }

export function contractResponse() { return getRecommendationCycleManagementContract(); }
export async function cycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { cycle: result.cycle, lifecycle: result.lifecycle, policy_bound_entry: result.policy_bound_entry }; }
export async function transactionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { transaction: result.transaction, ledger: result.ledger }; }
export async function generationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { generation: result.generation }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { evaluation: result.evaluation }; }
export async function completionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { completion: result.completion, certification_status: result.certification.status }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { recovery: result.recovery }; }
export async function supersessionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { supersession: result.supersession }; }
export async function archiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { archive: result.archive }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateRecommendationCycleManagement(result).valid }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { ledger: result.ledger, lifecycle: result.lifecycle }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateRecommendationCycleManagement(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationCycleManagement(); return { observability: result.observability, certification_status: result.certification.status }; }
