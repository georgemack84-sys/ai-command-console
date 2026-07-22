import { getLifecycleEngineBundle, runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { LifecycleEngineInput, LifecycleEngineResult } from "@/types/lifecycle-engine";

export async function requireLifecycleEngineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): LifecycleEngineInput { return body as LifecycleEngineInput; }
function resultFromBody(body: Record<string, unknown>): LifecycleEngineResult { return (body.result as LifecycleEngineResult | undefined) ?? runLifecycleEngine(inputFromBody(body)); }
export function contractResponse() { return getLifecycleEngineBundle(); }
export async function validateRequest(request: Request) { return validateLifecycleEngine(resultFromBody(await readBody(request))); }
export async function domainModelRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { domain_model: result.domain_model }; }
export async function runtimeStateMachineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { runtime_state_machine: result.runtime_state_machine }; }
export async function agentLifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { agent_lifecycle: result.agent_lifecycle }; }
export async function couplingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { coupling: result.coupling }; }
export async function transitionValidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { transition_validation: result.transition_validation }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { health_service: result.health_service }; }
export async function managersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { recovery_suspension_retirement_revocation: result.recovery_suspension_retirement_revocation }; }
export async function historyReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { history_replay: result.history_replay }; }
export async function apisObservabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { apis_observability: result.apis_observability }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLifecycleEngine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
