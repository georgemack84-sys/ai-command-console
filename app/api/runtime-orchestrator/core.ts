import { getRuntimeOrchestratorBundle, runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RuntimeOrchestratorInput, RuntimeOrchestratorResult } from "@/types/runtime-orchestrator";

export async function requireRuntimeOrchestratorUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RuntimeOrchestratorInput { return body as RuntimeOrchestratorInput; }
function resultFromBody(body: Record<string, unknown>): RuntimeOrchestratorResult { return (body.result as RuntimeOrchestratorResult | undefined) ?? runRuntimeOrchestrator(inputFromBody(body)); }
export function contractResponse() { return getRuntimeOrchestratorBundle(); }
export async function validateRequest(request: Request) { return validateRuntimeOrchestrator(resultFromBody(await readBody(request))); }
export async function controlPlaneRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { control_plane: result.control_plane }; }
export async function contextRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { context_assembly: result.context_assembly }; }
export async function adapterRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { reasoning_adapter: result.reasoning_adapter }; }
export async function restrictionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { restrictions: result.restrictions }; }
export async function tasksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { task_execution: result.task_execution }; }
export async function checkpointsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { checkpoints: result.checkpoints }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { recovery: result.recovery }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { apis: result.apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestrator(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
