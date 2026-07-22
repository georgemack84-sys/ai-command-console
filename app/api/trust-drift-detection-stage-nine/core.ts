import { getTrustDriftDetectionStageNineBundle, runTrustDriftDetectionStageNine, validateTrustDriftDetectionStageNine } from "@/services/trust-drift-detection-stage-nine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustDriftDetectionInput, TrustDriftDetectionResult } from "@/types/trust-drift-detection-stage-nine";

export async function requireTrustDriftDetectionStageNineUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustDriftDetectionInput { return body as TrustDriftDetectionInput; }
function resultFromBody(body: Record<string, unknown>): TrustDriftDetectionResult { return (body.result as TrustDriftDetectionResult | undefined) ?? runTrustDriftDetectionStageNine(inputFromBody(body)); }
export function contractResponse() { return getTrustDriftDetectionStageNineBundle(); }
export async function validateRequest(request: Request) { return validateTrustDriftDetectionStageNine(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { architecture: result.architecture }; }
export async function behavioralRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { behavioral: result.behavioral }; }
export async function confidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { confidence: result.confidence }; }
export async function alignmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { alignment: result.alignment }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { risk: result.risk }; }
export async function thresholdsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { thresholds: result.thresholds }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { alerts: result.alerts }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { evidence: result.evidence }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { explainability: result.explainability }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { replay: result.replay }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetectionStageNine(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
