import { getObservabilityPlatformBundle, runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ObservabilityPlatformInput, ObservabilityPlatformResult } from "@/types/observability-platform";

export async function requireObservabilityPlatformUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ObservabilityPlatformInput { return body as ObservabilityPlatformInput; }
function resultFromBody(body: Record<string, unknown>): ObservabilityPlatformResult { return (body.result as ObservabilityPlatformResult | undefined) ?? runObservabilityPlatform(inputFromBody(body)); }
export function contractResponse() { return getObservabilityPlatformBundle(); }
export async function validateRequest(request: Request) { return validateObservabilityPlatform(resultFromBody(await readBody(request))); }
export async function loggingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { logging: result.logging }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { metrics: result.metrics }; }
export async function tracingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { tracing: result.tracing }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { health: result.health }; }
export async function alertingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { alerting: result.alerting }; }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { dashboards: result.dashboards }; }
export async function diagnosticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { diagnostics: result.diagnostics }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityPlatform(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
