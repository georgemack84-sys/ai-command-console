import { getRecommendationSynthesisIntelligenceContract, runRecommendationSynthesisIntelligence, validateRecommendationSynthesisIntelligence } from "@/services/recommendation-synthesis-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RecommendationSynthesisInput, RecommendationSynthesisResult } from "@/types/recommendation-synthesis-intelligence";

export async function requireRecommendationSynthesisUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RecommendationSynthesisInput { return body as RecommendationSynthesisInput; }
function resultFromBody(body: Record<string, unknown>): RecommendationSynthesisResult { return (body.result as RecommendationSynthesisResult | undefined) ?? runRecommendationSynthesisIntelligence(inputFromBody(body)); }

export function contractResponse() { return getRecommendationSynthesisIntelligenceContract(); }
export async function createRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { eligibility: result.eligibility }; }
export async function outcomeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { outcome_resolution: result.outcome_resolution, non_recommendation: result.non_recommendation }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { authority_validation: result.authority_validation }; }
export async function explainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { explainability: result.explainability }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { integrity: result.integrity }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateRecommendationSynthesisIntelligence(result).valid }; }
export async function archiveRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { recommendation_id: result.recommendation.recommendation_id, lifecycle_state: "ARCHIVED" }; }
export async function supersedeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { recommendation_id: result.recommendation.recommendation_id, lifecycle_state: "SUPERSEDED" }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateRecommendationSynthesisIntelligence(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRecommendationSynthesisIntelligence(); return { observability: result.observability, certification_status: result.certification.status }; }
