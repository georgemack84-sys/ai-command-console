import { getMissionManagementBundle, runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MissionManagementInput, MissionManagementResult } from "@/types/mission-management";

export async function requireMissionManagementUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MissionManagementInput { return body as MissionManagementInput; }
function resultFromBody(body: Record<string, unknown>): MissionManagementResult { return (body.result as MissionManagementResult | undefined) ?? runMissionManagement(inputFromBody(body)); }
export function contractResponse() { return getMissionManagementBundle(); }
export async function validateRequest(request: Request) { return validateMissionManagement(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { registry: result.registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { lifecycle: result.lifecycle }; }
export async function projectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { projection: result.projection }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { lineage: result.lineage }; }
export async function templatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { templates: result.templates }; }
export async function objectivesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { objectives: result.objectives }; }
export async function assignmentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { assignment: result.assignment }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { dependencies: result.dependencies }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { timeline: result.timeline }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { evidence: result.evidence }; }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { rules: result.rules }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { apis: result.apis }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMissionManagement(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
