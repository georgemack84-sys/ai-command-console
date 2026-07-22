import { getTrustCertificationStageElevenBundle, runTrustCertificationStageEleven, validateTrustCertificationStageEleven } from "@/services/trust-certification-stage-eleven";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustCertificationInput, TrustCertificationResult } from "@/types/trust-certification-stage-eleven";

export async function requireTrustCertificationStageElevenUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustCertificationInput { return body as TrustCertificationInput; }
function resultFromBody(body: Record<string, unknown>): TrustCertificationResult { return (body.result as TrustCertificationResult | undefined) ?? runTrustCertificationStageEleven(inputFromBody(body)); }
export function contractResponse() { return getTrustCertificationStageElevenBundle(); }
export async function validateRequest(request: Request) { return validateTrustCertificationStageEleven(resultFromBody(await readBody(request))); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { framework: result.framework }; }
export async function evaluationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { evaluation: result.evaluation }; }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { rules: result.rules }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { evidence: result.evidence }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { reports: result.reports }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { registry: result.registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { lifecycle: result.lifecycle }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { explainability: result.explainability }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { replay: result.replay }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustCertificationStageEleven(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
