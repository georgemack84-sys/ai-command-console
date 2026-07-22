import { getTrustExplainabilityJustificationBundle, runTrustExplainabilityJustification, validateTrustExplainabilityJustification } from "@/services/trust-explainability-justification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustExplainabilityInput, TrustExplainabilityResult } from "@/types/trust-explainability-justification";

export async function requireTrustExplainabilityUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustExplainabilityInput { return body as TrustExplainabilityInput; }
function resultFromBody(body: Record<string, unknown>): TrustExplainabilityResult { return (body.result as TrustExplainabilityResult | undefined) ?? runTrustExplainabilityJustification(inputFromBody(body)); }
export function contractResponse() { return getTrustExplainabilityJustificationBundle(); }
export async function validateRequest(request: Request) { return validateTrustExplainabilityJustification(resultFromBody(await readBody(request))); }
export async function explanationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { explanation: result.explanation, graph: result.graph }; }
export async function traceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { trace: result.trace }; }
export async function justificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { justification: result.justification }; }
export async function transparencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { transparency: result.transparency }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { replay_hash: result.replay_hash, integrity_hash: result.integrity_hash, replay_references: result.trace.replay_references }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { report: result.justification, transparency: result.transparency }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityJustification(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
