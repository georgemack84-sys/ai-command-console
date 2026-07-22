import { getPortfolioAssessmentIntelligenceContract, runPortfolioAssessmentIntelligence, validatePortfolioAssessmentIntelligence } from "@/services/portfolio-assessment-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PortfolioAssessmentInput, PortfolioAssessmentResult } from "@/types/portfolio-assessment-intelligence";

export async function requirePortfolioAssessmentUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PortfolioAssessmentInput { return body as PortfolioAssessmentInput; }
function resultFromBody(body: Record<string, unknown>): PortfolioAssessmentResult { return (body.result as PortfolioAssessmentResult | undefined) ?? runPortfolioAssessmentIntelligence(inputFromBody(body)); }

export function contractResponse() { return getPortfolioAssessmentIntelligenceContract(); }
export async function assessRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); }
export async function membershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { membership: result.membership }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { dependencies: result.dependencies }; }
export async function resourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { resources: result.resources }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { risk: result.risk }; }
export async function scenariosRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { scenarios: result.scenarios }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { comparison: result.comparison }; }
export async function advisoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { advisory: result.advisory }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validatePortfolioAssessmentIntelligence(result).valid }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validatePortfolioAssessmentIntelligence(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPortfolioAssessmentIntelligence(); return { observability: result.observability, certification_status: result.certification.status }; }
