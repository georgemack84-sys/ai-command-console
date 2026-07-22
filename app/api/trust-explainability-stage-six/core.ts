import { getTrustExplainabilityStageSixBundle, runTrustExplainabilityStageSix, validateTrustExplainabilityStageSix } from "@/services/trust-explainability-stage-six";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustExplainabilityInput, TrustExplainabilityResult } from "@/types/trust-explainability-stage-six";

export async function requireTrustExplainabilityStageSixUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustExplainabilityInput { return body as TrustExplainabilityInput; }
function resultFromBody(body: Record<string, unknown>): TrustExplainabilityResult { return (body.result as TrustExplainabilityResult | undefined) ?? runTrustExplainabilityStageSix(inputFromBody(body)); }
export function contractResponse() { return getTrustExplainabilityStageSixBundle(); }
export async function validateRequest(request: Request) { return validateTrustExplainabilityStageSix(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { architecture: result.architecture }; }
export async function narrativeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { narrative: result.narrative }; }
export async function evidenceMapRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { evidence_map: result.evidence_map }; }
export async function ruleTraceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { rule_trace: result.rule_trace }; }
export async function constitutionalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { constitutional: result.constitutional }; }
export async function restrictionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { restrictions: result.restrictions }; }
export async function escalationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { escalations: result.escalations }; }
export async function packageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { package: result.package }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustExplainabilityStageSix(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
