import { getWaveFiveProvingGroundBundle, runWaveFiveProvingGround, validateWaveFiveProvingGround } from "@/services/wave-five-proprium-proving-ground";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveProvingGroundInput, WaveFiveProvingGroundResult } from "@/types/wave-five-proprium-proving-ground";

export async function requireWaveFiveProvingGroundUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveProvingGroundInput { return body as WaveFiveProvingGroundInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveProvingGroundResult { return (body.result as WaveFiveProvingGroundResult | undefined) ?? runWaveFiveProvingGround(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveProvingGroundBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveProvingGround(resultFromBody(await readBody(request))); }
export async function sandboxRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { sandbox: result.sandbox }; }
export async function syntheticSimulationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { synthetic_simulation: result.synthetic_simulation }; }
export async function failureReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { failure_replay: result.failure_replay }; }
export async function promotionEvidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { promotion_evidence: result.promotion_evidence }; }
export async function registryDashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { registry_dashboard: result.registry_dashboard }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveProvingGround(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
