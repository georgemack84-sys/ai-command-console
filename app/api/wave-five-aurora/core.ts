import { getWaveFiveAuroraBundle, runWaveFiveAurora, validateWaveFiveAurora } from "@/services/wave-five-aurora";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveAuroraInput, WaveFiveAuroraResult } from "@/types/wave-five-aurora";

export async function requireWaveFiveAuroraUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveAuroraInput { return body as WaveFiveAuroraInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveAuroraResult { return (body.result as WaveFiveAuroraResult | undefined) ?? runWaveFiveAurora(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveAuroraBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveAurora(resultFromBody(await readBody(request))); }
export async function conversationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { conversation: result.conversation }; }
export async function briefingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { briefing: result.briefing }; }
export async function contextAssemblyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { context_assembly: result.context_assembly }; }
export async function actionRoutingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { action_routing: result.action_routing }; }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { explanation: result.explanation }; }
export async function governanceSecurityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { governance_security: result.governance_security }; }
export async function memoryWorkflowsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { memory_workflows: result.memory_workflows }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveAurora(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
