import { getOperatorDashboardBundle, runOperatorDashboard, validateOperatorDashboard } from "@/services/operator-dashboard";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperatorDashboardInput, OperatorDashboardResult } from "@/types/operator-dashboard";

export async function requireOperatorDashboardUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperatorDashboardInput { return body as OperatorDashboardInput; }
function resultFromBody(body: Record<string, unknown>): OperatorDashboardResult { return (body.result as OperatorDashboardResult | undefined) ?? runOperatorDashboard(inputFromBody(body)); }
export function contractResponse() { return getOperatorDashboardBundle(); }
export async function validateRequest(request: Request) { return validateOperatorDashboard(resultFromBody(await readBody(request))); }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { dashboard: result.dashboard, view_kinds: result.view_kinds }; }
export async function missionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { mission: result.mission }; }
export async function portfolioRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { portfolio: result.portfolio }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { risk: result.risk }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { replay: result.replay }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { recommendations: result.recommendations }; }
export async function digitalTwinRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { digital_twin: result.digital_twin }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { alerts: result.alerts }; }
export async function kpisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { kpis: result.kpis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { evidence: result.evidence, audit: result.audit }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { search: result.search }; }
export async function filtersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { filters: result.filters }; }
export async function visualizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { visualization: result.visualization }; }
export async function navigationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { navigation: result.navigation }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { security: result.security }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { apis: result.apis }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperatorDashboard(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
