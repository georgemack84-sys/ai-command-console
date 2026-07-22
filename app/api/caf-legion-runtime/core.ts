import { getCafLegionRuntimeBundle, runCafLegionRuntime, validateCafLegionRuntime } from "@/services/caf-legion-runtime";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CafLegionRuntimeInput, CafLegionRuntimeResult } from "@/types/caf-legion-runtime";

export async function requireCafLegionRuntimeUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CafLegionRuntimeInput { return body as CafLegionRuntimeInput; }
function resultFromBody(body: Record<string, unknown>): CafLegionRuntimeResult { return (body.result as CafLegionRuntimeResult | undefined) ?? runCafLegionRuntime(inputFromBody(body)); }
export function contractResponse() { return getCafLegionRuntimeBundle(); }
export async function validateRequest(request: Request) { return validateCafLegionRuntime(resultFromBody(await readBody(request))); }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { runtime_foundation: result.runtime_foundation }; }
export async function agentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { agent_registry: result.agent_registry }; }
export async function orchestratorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { orchestrator: result.orchestrator }; }
export async function registriesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { capability_skill_registries: result.capability_skill_registries }; }
export async function planningMemoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { planning_memory: result.planning_memory }; }
export async function collaborationDelegationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { collaboration_delegation: result.collaboration_delegation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { governance: result.governance }; }
export async function operatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { operator_console: result.operator_console }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { replay: result.replay }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { certification: result.certification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafLegionRuntime(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
