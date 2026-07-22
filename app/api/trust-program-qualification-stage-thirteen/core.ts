import { getTrustProgramQualificationStageThirteenBundle, runTrustProgramQualificationStageThirteen, validateTrustProgramQualificationStageThirteen } from "@/services/trust-program-qualification-stage-thirteen";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustProgramQualificationInput, TrustProgramQualificationResult } from "@/types/trust-program-qualification-stage-thirteen";

export async function requireTrustProgramQualificationStageThirteenUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustProgramQualificationInput { return body as TrustProgramQualificationInput; }
function resultFromBody(body: Record<string, unknown>): TrustProgramQualificationResult { return (body.result as TrustProgramQualificationResult | undefined) ?? runTrustProgramQualificationStageThirteen(inputFromBody(body)); }
export function contractResponse() { return getTrustProgramQualificationStageThirteenBundle(); }
export async function validateRequest(request: Request) { return validateTrustProgramQualificationStageThirteen(resultFromBody(await readBody(request))); }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { matrix: result.matrix }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { replay: result.replay }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { lineage: result.lineage }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { isolation: result.isolation }; }
export async function findingsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { findings: result.findings }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { authority: result.authority }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustProgramQualificationStageThirteen(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
