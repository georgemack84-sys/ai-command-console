import { getMonitoringExperienceBundle, runMonitoringExperience, validateMonitoringExperience } from "@/services/monitoring-experience";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MonitoringExperienceInput, MonitoringExperienceResult } from "@/types/monitoring-experience";

export async function requireMonitoringExperienceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MonitoringExperienceInput { return body as MonitoringExperienceInput; }
function resultFromBody(body: Record<string, unknown>): MonitoringExperienceResult { return (body.result as MonitoringExperienceResult | undefined) ?? runMonitoringExperience(inputFromBody(body)); }
export function contractResponse() { return getMonitoringExperienceBundle(); }
export async function validateRequest(request: Request) { return validateMonitoringExperience(resultFromBody(await readBody(request))); }
export async function aggregatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { aggregator: result.aggregator }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { alerts: result.alerts }; }
export async function slaRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { sla: result.sla }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { analytics: result.analytics }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { health: result.health }; }
export async function alertCenterRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { alert_center: result.alert_center }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { dashboard: result.dashboard }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMonitoringExperience(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
