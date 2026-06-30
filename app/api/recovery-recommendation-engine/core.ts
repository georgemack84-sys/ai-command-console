import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryRecommendationObservabilitySurface,
  generateRecoveryRecommendations,
  getRecoveryRecommendationEngineContract,
  replayRecoveryRecommendations,
  validateRecoveryRecommendationPackage,
} from "@/services/recovery-recommendation-engine";
import type { RecoveryRecommendationInput, RecoveryRecommendationPackage } from "@/types/recovery-recommendation-engine";

export async function requireRecoveryRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryRecommendationInput {
  return body as RecoveryRecommendationInput;
}

function packageFromBody(body: Record<string, unknown>): RecoveryRecommendationPackage {
  return (body.recommendation_package as RecoveryRecommendationPackage | undefined) ?? generateRecoveryRecommendations(inputFromBody(body));
}

export function contractResponse() { return getRecoveryRecommendationEngineContract(); }
export async function recommendationsRequest(request: Request) { return generateRecoveryRecommendations(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryRecommendationPackage(packageFromBody(await readBody(request))); }
export async function rankRequest(request: Request) {
  const pkg = packageFromBody(await readBody(request));
  return {
    package_id: pkg.package_id,
    ranked_recommendations: pkg.recommendations.map((item) => ({ rank: item.rank, recommendation_id: item.recommendation_id, type: item.recommendation_type, level: item.recommendation_level, confidence: item.confidence_score, risk: item.recovery_risk })),
  };
}
export async function guidanceRequest(request: Request) { return packageFromBody(await readBody(request)).operator_package; }
export async function replayRequest(request: Request) { return replayRecoveryRecommendations(packageFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryRecommendationObservabilitySurface();
  return buildRecoveryRecommendationObservabilitySurface(packageFromBody(await readBody(request)));
}
