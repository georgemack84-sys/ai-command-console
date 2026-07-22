import { getWaveFiveCalendarTimeBundle, runWaveFiveCalendarTime, validateWaveFiveCalendarTime } from "@/services/wave-five-calendar-time";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveCalendarTimeInput, WaveFiveCalendarTimeResult } from "@/types/wave-five-calendar-time";

export async function requireWaveFiveCalendarTimeUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveCalendarTimeInput { return body as WaveFiveCalendarTimeInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveCalendarTimeResult { return (body.result as WaveFiveCalendarTimeResult | undefined) ?? runWaveFiveCalendarTime(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveCalendarTimeBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveCalendarTime(resultFromBody(await readBody(request))); }
export async function calendarRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { calendar: result.calendar }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { events: result.events }; }
export async function schedulingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { scheduling: result.scheduling }; }
export async function availabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { availability: result.availability }; }
export async function conflictsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { conflicts: result.conflicts }; }
export async function timeBudgetRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { time_budget: result.time_budget }; }
export async function resourcesCoordinationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { resources_coordination: result.resources_coordination }; }
export async function notificationsAnalyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { notifications_analytics: result.notifications_analytics }; }
export async function evidenceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { evidence_governance: result.evidence_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveCalendarTime(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
