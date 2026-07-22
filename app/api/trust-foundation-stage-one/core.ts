import { getTrustFoundationStageOneBundle, runTrustFoundationStageOne, validateTrustFoundationStageOne } from "@/services/trust-foundation-stage-one";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustFoundationStageOneInput, TrustFoundationStageOneResult } from "@/types/trust-foundation-stage-one";

export async function requireTrustFoundationStageOneUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustFoundationStageOneInput { return body as TrustFoundationStageOneInput; }
function resultFromBody(body: Record<string, unknown>): TrustFoundationStageOneResult { return (body.result as TrustFoundationStageOneResult | undefined) ?? runTrustFoundationStageOne(inputFromBody(body)); }
export function contractResponse() { return getTrustFoundationStageOneBundle(); }
export async function validateRequest(request: Request) { return validateTrustFoundationStageOne(resultFromBody(await readBody(request))); }
export async function constitutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { constitution: result.constitution }; }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { architecture: result.architecture }; }
export async function doctrineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { doctrine: result.doctrine }; }
export async function vocabularyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { vocabulary: result.vocabulary }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { lifecycle: result.lifecycle }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { apis: result.apis }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { contracts: result.contracts }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { events: result.events }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { governance: result.governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustFoundationStageOne(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
