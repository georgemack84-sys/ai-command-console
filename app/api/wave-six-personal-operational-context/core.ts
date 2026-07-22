import { getWaveSixPersonalOperationalContextBundle, runWaveSixPersonalOperationalContext, validateWaveSixPersonalOperationalContext } from "@/services/wave-six-personal-operational-context";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixPersonalOperationalContextInput, WaveSixPersonalOperationalContextResult } from "@/types/wave-six-personal-operational-context";

export async function requireWaveSixPersonalOperationalContextUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixPersonalOperationalContextInput { return body as WaveSixPersonalOperationalContextInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixPersonalOperationalContextResult { return (body.result as WaveSixPersonalOperationalContextResult | undefined) ?? runWaveSixPersonalOperationalContext(inputFromBody(body)); }
export function contractResponse() { return getWaveSixPersonalOperationalContextBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixPersonalOperationalContext(resultFromBody(await readBody(request))); }
export async function contextManagerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { context_manager: result.context_manager }; }
export async function goalsProjectsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { goals_projects: result.goals_projects }; }
export async function routinesSchedulesPrioritiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { routines_schedules_priorities: result.routines_schedules_priorities }; }
export async function workingSnapshotHistoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { working_snapshot_history: result.working_snapshot_history }; }
export async function constitutionalBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { constitutional_boundary: result.constitutional_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixPersonalOperationalContext(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
