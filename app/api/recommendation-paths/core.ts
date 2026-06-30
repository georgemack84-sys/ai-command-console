import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAlternativePathContract,
  buildAlternativePathObservabilitySurface,
  computeAlternativePathGenerationHash,
  generateAlternativeGovernancePaths,
  replayAlternativePathGeneration,
  validateAlternativePathGeneration,
} from "@/services/recommendation-paths";
import type { AlternativePathGenerationResult, RecommendationPathScenario } from "@/types/recommendation-paths";

export async function requireRecommendationPathsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getRecommendationPathsContractResponse() {
  return buildAlternativePathContract();
}

export async function generateRecommendationPathsRequest(request: Request) {
  const body = await readBody(request) as { scenario?: RecommendationPathScenario };
  return generateAlternativeGovernancePaths(body);
}

export async function validateRecommendationPathsRequest(request: Request) {
  const body = await readBody(request);
  return validateAlternativePathGeneration(Object.keys(body).length ? body as Partial<AlternativePathGenerationResult> : generateAlternativeGovernancePaths());
}

export async function replayRecommendationPathsRequest(request: Request) {
  const body = await readBody(request);
  return replayAlternativePathGeneration(Object.keys(body).length ? body as AlternativePathGenerationResult : generateAlternativeGovernancePaths());
}

export async function hashRecommendationPathsRequest(request: Request) {
  const body = await readBody(request);
  const result = Object.keys(body).length ? body as AlternativePathGenerationResult : generateAlternativeGovernancePaths();
  return { alternative_path_generation_hash: computeAlternativePathGenerationHash(result) };
}

export async function inspectRecommendationPathsRequest(request?: Request) {
  if (!request) return buildAlternativePathObservabilitySurface();
  const body = await readBody(request);
  return buildAlternativePathObservabilitySurface(Object.keys(body).length ? body as AlternativePathGenerationResult : generateAlternativeGovernancePaths());
}
