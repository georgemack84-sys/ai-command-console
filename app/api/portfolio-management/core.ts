import { getPortfolioManagementBundle, runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PortfolioManagementInput, PortfolioManagementResult } from "@/types/portfolio-management";

export async function requirePortfolioManagementUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PortfolioManagementInput { return body as PortfolioManagementInput; }
function resultFromBody(body: Record<string, unknown>): PortfolioManagementResult { return (body.result as PortfolioManagementResult | undefined) ?? runPortfolioManagement(inputFromBody(body)); }
export function contractResponse() { return getPortfolioManagementBundle(); }
export async function validateRequest(request: Request) { return validatePortfolioManagement(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { registry: result.registry }; }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { engine: result.engine }; }
export async function resourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { resources: result.resources }; }
export async function prioritizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { prioritization: result.prioritization }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { dependencies: result.dependencies }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { health: result.health }; }
export async function conflictsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { conflicts: result.conflicts }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { analytics: result.analytics }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { dashboard: result.dashboard }; }
export async function reportingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { reporting: result.reporting }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { evidence: result.evidence }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { apis: result.apis }; }
export async function scaleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { scale: result.scale }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioManagement(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
