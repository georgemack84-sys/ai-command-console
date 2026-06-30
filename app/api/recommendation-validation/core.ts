import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecommendationValidationContract,
  buildRecommendationValidationObservabilitySurface,
  computeRecommendationValidationHash,
  replayRecommendationValidation,
  validateRecommendation,
} from "@/services/recommendation-validation";
import type { RecommendationValidationResult, RecommendationValidationScenario } from "@/types/recommendation-validation";

export async function requireRecommendationValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationValidationContractResponse() {
  return buildRecommendationValidationContract();
}

export async function generateRecommendationValidationRequest(request: Request) {
  const body = await readBody(request) as { scenario?: RecommendationValidationScenario };
  return validateRecommendation(body);
}

export async function validateRecommendationValidationRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationValidationResult> & { scenario?: RecommendationValidationScenario };
  if (body.validation) return replayRecommendationValidation(body.validation);
  return validateRecommendation({ scenario: body.scenario });
}

export async function replayRecommendationValidationRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationValidationResult> & { scenario?: RecommendationValidationScenario };
  const result = body.validation ? body as RecommendationValidationResult : validateRecommendation({ scenario: body.scenario });
  return replayRecommendationValidation(result.validation);
}

export async function hashRecommendationValidationRequest(request: Request) {
  const body = await readBody(request) as Partial<RecommendationValidationResult> & { scenario?: RecommendationValidationScenario };
  const result = body.validation ? body as RecommendationValidationResult : validateRecommendation({ scenario: body.scenario });
  return { recommendation_validation_hash: computeRecommendationValidationHash(result.validation) };
}

export async function inspectRecommendationValidationRequest(request?: Request) {
  if (!request) return buildRecommendationValidationObservabilitySurface();
  const body = await readBody(request) as Partial<RecommendationValidationResult> & { scenario?: RecommendationValidationScenario };
  const result = body.validation ? body as RecommendationValidationResult : validateRecommendation({ scenario: body.scenario });
  return buildRecommendationValidationObservabilitySurface(result);
}
