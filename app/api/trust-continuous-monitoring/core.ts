import { getTrustContinuousMonitoringBundle, runTrustContinuousMonitoring, validateTrustContinuousMonitoring } from "@/services/trust-continuous-monitoring";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustMonitoringInput, TrustMonitoringResult } from "@/types/trust-continuous-monitoring";

export async function requireTrustMonitoringUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustMonitoringInput { return body as TrustMonitoringInput; }
function resultFromBody(body: Record<string, unknown>): TrustMonitoringResult { return (body.result as TrustMonitoringResult | undefined) ?? runTrustContinuousMonitoring(inputFromBody(body)); }
export function contractResponse() { return getTrustContinuousMonitoringBundle(); }
export async function validateRequest(request: Request) { return validateTrustContinuousMonitoring(resultFromBody(await readBody(request))); }
export async function recordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { record: result.record }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { health: result.health }; }
export async function standingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { standing: result.standing }; }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { pipeline: result.pipeline, findings: result.report.findings }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { report: result.report, boundary: result.boundary }; }
export async function trendsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { trend: result.health.trend, report: result.report }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { alerts: result.alerts }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { dashboard: result.dashboard }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { ledger: result.ledger }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContinuousMonitoring(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
