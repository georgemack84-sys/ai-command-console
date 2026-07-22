import { getStrategyComparisonIntelligenceContract, runStrategyComparisonIntelligence, validateStrategyComparisonIntelligence } from "@/services/strategy-comparison-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategyComparisonInput, StrategyComparisonResult } from "@/types/strategy-comparison-intelligence";

export async function requireStrategyComparisonUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategyComparisonInput { return body as StrategyComparisonInput; }
function resultFromBody(body: Record<string, unknown>): StrategyComparisonResult { return (body.result as StrategyComparisonResult | undefined) ?? runStrategyComparisonIntelligence(inputFromBody(body)); }

export function contractResponse() { return getStrategyComparisonIntelligenceContract(); }
export async function createRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { eligibility: result.eligibility }; }
export async function dimensionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { dimensions: result.dimensions }; }
export async function thresholdsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { thresholds: result.thresholds }; }
export async function tiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { tie_resolution: result.tie_resolution }; }
export async function completeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { comparison: result.comparison, registry: result.registry }; }
export async function supersessionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { supersession: result.supersession }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateStrategyComparisonIntelligence(result).valid }; }
export async function explainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { explainability: result.explainability }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateStrategyComparisonIntelligence(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategyComparisonIntelligence(); return { observability: result.observability, certification_status: result.certification.status }; }
