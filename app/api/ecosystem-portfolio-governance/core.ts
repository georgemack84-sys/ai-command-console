import { getEcosystemPortfolioGovernanceBundle, runEcosystemPortfolioGovernance, validateEcosystemPortfolioGovernance } from "@/services/ecosystem-portfolio-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { EcosystemPortfolioGovernanceInput, EcosystemPortfolioGovernanceResult } from "@/types/ecosystem-portfolio-governance";

export async function requireEcosystemPortfolioGovernanceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): EcosystemPortfolioGovernanceInput { return body as EcosystemPortfolioGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): EcosystemPortfolioGovernanceResult { return (body.result as EcosystemPortfolioGovernanceResult | undefined) ?? runEcosystemPortfolioGovernance(inputFromBody(body)); }
export function contractResponse() { return getEcosystemPortfolioGovernanceBundle(); }
export async function validateRequest(request: Request) { return validateEcosystemPortfolioGovernance(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { foundation: result.foundation }; }
export async function inventoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { inventory: result.inventory }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { certification_aggregation: result.certification_aggregation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { governance_aggregation: result.governance_aggregation }; }
export async function interoperabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { interoperability_monitoring: result.interoperability_monitoring }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { operational_monitoring: result.operational_monitoring }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { dashboard: result.dashboard }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { reports: result.reports }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { analytics: result.analytics }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { health: result.health }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { evidence: result.evidence }; }
export async function executiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runEcosystemPortfolioGovernance(); return { executive: result.executive, boundary: result.boundary, certification: result.certification, integrity_hash: result.integrity_hash }; }
