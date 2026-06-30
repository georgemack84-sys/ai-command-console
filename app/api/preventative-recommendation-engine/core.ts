import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPreventativeRecommendationObservabilitySurface,
  getPreventativeRecommendationEngineContract,
  replayPreventativeRecommendations,
  runPreventativeRecommendations,
  validatePreventativeRecommendations,
} from "@/services/preventative-recommendation-engine";
import type { PreventativeRecommendationInput, PreventativeRecommendationReport } from "@/types/preventative-recommendation-engine";

export async function requirePreventativeRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PreventativeRecommendationInput {
  return body as PreventativeRecommendationInput;
}

function reportFromBody(body: Record<string, unknown>): PreventativeRecommendationReport {
  return (body.report as PreventativeRecommendationReport | undefined) ?? runPreventativeRecommendations(inputFromBody(body));
}

export function contractResponse() { return getPreventativeRecommendationEngineContract(); }
export async function recommendationsRequest(request: Request) { return runPreventativeRecommendations(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validatePreventativeRecommendations(reportFromBody(await readBody(request))); }
export async function repositoryRequest(request: Request) { return reportFromBody(await readBody(request)).repository; }
export async function explainRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return {
    report_id: report.report_id,
    explanations: report.recommendations.map((recommendation) => ({
      recommendation_id: recommendation.recommendation_id,
      recommendation_type: recommendation.recommendation_type,
      explanation: recommendation.explanation,
      assumptions: recommendation.assumptions,
      constraints: recommendation.constraints,
    })),
  };
}
export async function replayRequest(request: Request) { return replayPreventativeRecommendations(reportFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildPreventativeRecommendationObservabilitySurface();
  return buildPreventativeRecommendationObservabilitySurface(reportFromBody(await readBody(request)));
}
