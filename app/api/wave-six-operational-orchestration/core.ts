import { getWaveSixOperationalOrchestrationBundle, runWaveSixOperationalOrchestration, validateWaveSixOperationalOrchestration } from "@/services/wave-six-operational-orchestration";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixOperationalOrchestrationInput, WaveSixOperationalOrchestrationResult } from "@/types/wave-six-operational-orchestration";

export async function requireWaveSixOperationalOrchestrationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixOperationalOrchestrationInput { return body as WaveSixOperationalOrchestrationInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixOperationalOrchestrationResult { return (body.result as WaveSixOperationalOrchestrationResult | undefined) ?? runWaveSixOperationalOrchestration(inputFromBody(body)); }
export function contractResponse() { return getWaveSixOperationalOrchestrationBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixOperationalOrchestration(resultFromBody(await readBody(request))); }
export async function schedulerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOrchestration(); return { scheduler: result.scheduler }; }
export async function workflowBackgroundQueueRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOrchestration(); return { workflow_background_queue: result.workflow_background_queue }; }
export async function scheduleRegistryPoliciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOrchestration(); return { schedule_registry_policies: result.schedule_registry_policies }; }
export async function coordinationEvidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOrchestration(); return { coordination_evidence: result.coordination_evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixOperationalOrchestration(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
