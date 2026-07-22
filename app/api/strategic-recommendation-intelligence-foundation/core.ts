import { getStrategicRecommendationIntelligenceFoundationContract, runStrategicRecommendationIntelligenceFoundation, validateStrategicRecommendationIntelligenceFoundation } from "@/services/strategic-recommendation-intelligence-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategicFoundationInput, StrategicFoundationResult } from "@/types/strategic-recommendation-intelligence-foundation";

export async function requireStrategicFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategicFoundationInput { return body as StrategicFoundationInput; }
function resultFromBody(body: Record<string, unknown>): StrategicFoundationResult { return (body.result as StrategicFoundationResult | undefined) ?? runStrategicRecommendationIntelligenceFoundation(inputFromBody(body)); }
export function contractResponse() { return getStrategicRecommendationIntelligenceFoundationContract(); }
export async function dashboardRequest(request?: Request) { if (!request) return runStrategicRecommendationIntelligenceFoundation(); return runStrategicRecommendationIntelligenceFoundation(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateStrategicRecommendationIntelligenceFoundation(resultFromBody(await readBody(request))); }
export async function vocabularyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicRecommendationIntelligenceFoundation(); return { vocabulary_registry: result.vocabulary_registry, certification: result.certification }; }
export async function identitiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicRecommendationIntelligenceFoundation(); return { identities: result.identities, artifact_registry: result.artifact_registry }; }
export async function originsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicRecommendationIntelligenceFoundation(); return { origin_registry: result.origin_registry, source_of_truth_registry: result.source_of_truth_registry }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicRecommendationIntelligenceFoundation(); return { lifecycle_transition_registry: result.lifecycle_transition_registry, referential_integrity: result.referential_integrity, replay_hash: result.replay_hash }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicRecommendationIntelligenceFoundation(); return { certification: result.certification, downstream_phase_12_enabled: result.certification.downstream_phase_12_enabled, integrity_hash: result.integrity_hash }; }
