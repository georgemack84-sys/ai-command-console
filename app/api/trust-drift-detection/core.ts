import { getTrustDriftDetectionBundle, runTrustDriftDetection, validateTrustDriftDetection } from "@/services/trust-drift-detection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustDriftInput, TrustDriftResult } from "@/types/trust-drift-detection";

export async function requireTrustDriftUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustDriftInput { return body as TrustDriftInput; }
function resultFromBody(body: Record<string, unknown>): TrustDriftResult { return (body.result as TrustDriftResult | undefined) ?? runTrustDriftDetection(inputFromBody(body)); }
export function contractResponse() { return getTrustDriftDetectionBundle(); }
export async function validateRequest(request: Request) { return validateTrustDriftDetection(resultFromBody(await readBody(request))); }
export async function recordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { record: result.record }; }
export async function classificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { classification: result.classification }; }
export async function severityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { severity: result.severity }; }
export async function trendsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { trends: result.trends }; }
export async function rootCauseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { root_cause_analysis: result.record.root_cause_analysis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { evidence: result.evidence }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { alerts: result.alerts }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { report: result.report, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustDriftDetection(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
