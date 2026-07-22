import { getScenarioPlanningBundle, runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ScenarioPlanningInput, ScenarioPlanningResult } from "@/types/scenario-planning";

export async function requireScenarioPlanningUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ScenarioPlanningInput { return body as ScenarioPlanningInput; }
function resultFromBody(body: Record<string, unknown>): ScenarioPlanningResult { return (body.result as ScenarioPlanningResult | undefined) ?? runScenarioPlanning(inputFromBody(body)); }
export function contractResponse() { return getScenarioPlanningBundle(); }
export async function validateRequest(request: Request) { return validateScenarioPlanning(resultFromBody(await readBody(request))); }
export async function definitionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { definition: result.definition }; }
export async function generationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { generation: result.generation }; }
export async function assumptionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { assumptions: result.assumptions }; }
export async function whatIfRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { what_if: result.what_if }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { evaluation: result.evaluation }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { risk: result.risk }; }
export async function opportunityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { opportunity: result.opportunity }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { comparison: result.comparison }; }
export async function recommendationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { recommendation: result.recommendation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { evidence: result.evidence }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { lifecycle: result.lifecycle }; }
export async function outputsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { outputs: result.outputs }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioPlanning(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
