import {
  buildConstitutionalRecommendationObservabilitySurface,
  generateConstitutionalRecommendations,
  getConstitutionalRecommendationEngine,
  listConstitutionalRecommendationConfidence,
  listConstitutionalRecommendationExplanations,
  listConstitutionalRecommendationLedger,
  listConstitutionalRecommendations,
  listSuppressedConstitutionalRecommendations,
  validateConstitutionalRecommendationEngine,
} from "@/services/constitutional-recommendation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalRecommendationInput, ConstitutionalRecommendationRepository } from "@/types/constitutional-recommendation-engine";

export async function requireConstitutionalRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalRecommendationRepository {
  return (body.repository as ConstitutionalRecommendationRepository | undefined) ?? generateConstitutionalRecommendations(body as ConstitutionalRecommendationInput);
}

export function contractResponse() { return getConstitutionalRecommendationEngine(); }
export async function recommendRequest(request: Request) { return generateConstitutionalRecommendations((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function recommendationsRequest(request: Request) { return listConstitutionalRecommendations((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function confidenceRequest(request: Request) { return listConstitutionalRecommendationConfidence((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function explanationsRequest(request: Request) { return listConstitutionalRecommendationExplanations((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function suppressedRequest(request: Request) { return listSuppressedConstitutionalRecommendations((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalRecommendationLedger((await readBody(request)) as ConstitutionalRecommendationInput); }
export async function validateRequest(request: Request) { return validateConstitutionalRecommendationEngine(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalRecommendationObservabilitySurface();
  return buildConstitutionalRecommendationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
