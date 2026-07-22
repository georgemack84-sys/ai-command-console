import { getPlanningEngineBundle, runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlanningEngineInput, PlanningEngineResult } from "@/types/planning-engine";

export async function requirePlanningEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PlanningEngineInput { return body as PlanningEngineInput; }
function resultFromBody(body: Record<string, unknown>): PlanningEngineResult { return (body.result as PlanningEngineResult | undefined) ?? runPlanningEngine(inputFromBody(body)); }
export function contractResponse() { return getPlanningEngineBundle(); }
export async function validateRequest(request: Request) { return validatePlanningEngine(resultFromBody(await readBody(request))); }
export async function goalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { goal_decomposition: result.goal_decomposition }; }
export async function graphRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { planning_graph: result.planning_graph }; }
export async function generationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { plan_generation: result.plan_generation }; }
export async function constraintsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { constraints: result.constraints }; }
export async function reviewRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { review: result.review }; }
export async function approvalsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { approvals: result.approvals }; }
export async function validationEngineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { validation_engine: result.validation_engine }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { registry: result.registry }; }
export async function contractRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { reasoning_runtime_contract: result.reasoning_runtime_contract }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlanningEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
