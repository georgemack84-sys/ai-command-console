import {
  buildImprovementRecommendationObservabilitySurface,
  generateImprovementRecommendations,
  getImprovementRecommendationEngineBundle,
  listRecommendationEvidenceChains,
  listRecommendationGuidance,
  listRecommendationLedger,
  listRecommendationRules,
  validateImprovementRecommendations,
} from "@/services/improvement-recommendation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ImprovementRecommendationInput, ImprovementRecommendationRepository } from "@/types/improvement-recommendation-engine";

export async function requireImprovementRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ImprovementRecommendationRepository {
  return (body.repository as ImprovementRecommendationRepository | undefined) ?? generateImprovementRecommendations(body as ImprovementRecommendationInput);
}

export function recommendationBundleResponse() { return getImprovementRecommendationEngineBundle(); }
export async function recommendRequest(request: Request) { return generateImprovementRecommendations((await readBody(request)) as ImprovementRecommendationInput); }
export async function rulesRequest(request: Request) { return listRecommendationRules((await readBody(request)) as ImprovementRecommendationInput); }
export async function evidenceRequest(request: Request) { return listRecommendationEvidenceChains((await readBody(request)) as ImprovementRecommendationInput); }
export async function guidanceRequest(request: Request) { return listRecommendationGuidance((await readBody(request)) as ImprovementRecommendationInput); }
export async function ledgerRequest(request: Request) { return listRecommendationLedger((await readBody(request)) as ImprovementRecommendationInput); }
export async function validateRequest(request: Request) { return validateImprovementRecommendations(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildImprovementRecommendationObservabilitySurface();
  return buildImprovementRecommendationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
