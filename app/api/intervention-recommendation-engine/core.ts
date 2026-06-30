import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildInterventionRecommendationDashboardSurface,
  buildInterventionRecommendationPackage,
  getInterventionRecommendationFramework,
} from "@/services/intervention-recommendation-engine";
import type { DriftHealthPackage } from "@/types/drift-health-intelligence";
import type { InterventionRecommendationPackage, InterventionRecommendationScenario } from "@/types/intervention-recommendation-engine";

export async function requireInterventionRecommendationEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function packageFromBody(body: Record<string, unknown>): InterventionRecommendationPackage {
  return (body.package as InterventionRecommendationPackage | undefined) ?? buildInterventionRecommendationPackage({
    scenario: body.scenario as InterventionRecommendationScenario | undefined,
    driftHealthPackage: body.driftHealthPackage as DriftHealthPackage | undefined,
  });
}

export function getInterventionRecommendationContractResponse() {
  return getInterventionRecommendationFramework();
}

export async function recommendInterventionRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body);
}

export async function validateInterventionRecommendationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).validation;
}

export async function replayInterventionRecommendationRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).replay;
}

export async function interventionRecommendationEvidenceRequest(request: Request) {
  const body = await readBody(request);
  return packageFromBody(body).recommendation_evidence;
}

export async function inspectInterventionRecommendationRequest(request?: Request) {
  if (!request) return buildInterventionRecommendationDashboardSurface();
  const body = await readBody(request);
  return buildInterventionRecommendationDashboardSurface(packageFromBody(body));
}
