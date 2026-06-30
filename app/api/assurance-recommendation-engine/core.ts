import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyAssuranceRecommendation,
  generateAssuranceRecommendation,
  getAssuranceRecommendationEngineContract,
  publishAssuranceRecommendation,
  replayAssuranceRecommendation,
  validateAssuranceRecommendation,
} from "@/services/assurance-recommendation-engine";
import type { AssuranceRecommendationInput, AssuranceRecommendationRecord } from "@/types/assurance-recommendation-engine";

export async function requireAssuranceRecommendationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AssuranceRecommendationInput {
  return body as AssuranceRecommendationInput;
}

function recordFromBody(body: Record<string, unknown>): AssuranceRecommendationRecord {
  return (body.record as AssuranceRecommendationRecord | undefined) ?? generateAssuranceRecommendation(inputFromBody(body));
}

export function contractResponse() { return getAssuranceRecommendationEngineContract(); }
export async function recommendRequest(request: Request) { return generateAssuranceRecommendation(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAssuranceRecommendation(recordFromBody(await readBody(request))); }
export async function alternativesRequest(request: Request) { return recordFromBody(await readBody(request)).alternatives; }
export async function explanationRequest(request: Request) { return recordFromBody(await readBody(request)).explanation; }
export async function replayRequest(request: Request) { return replayAssuranceRecommendation(recordFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyAssuranceRecommendation(recordFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishAssuranceRecommendation();
  return publishAssuranceRecommendation(recordFromBody(await readBody(request)));
}
