import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";
import { evaluateConstitutionalReadiness } from "@/services/readiness/constitutionalReadiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadReadinessModel(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "unauthorized", "Authentication required.");
  }
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const tenantContext = requireTenantApiContext({ request, user });
  const executive = await buildExecutiveOperationsAggregator({ tenantContext, operatorId: user.id });
  const resilience = buildConstitutionalResilienceEngine({ executiveModel: executive, nowMs: Date.now() });
  return evaluateConstitutionalReadiness({ resilience, executive, nowMs: Date.now() });
}

export async function GET(request: Request) {
  try {
    const model = await loadReadinessModel(request);
    return apiSuccess({
      assessment: model.assessment,
      drifts: model.drifts,
      confidenceLineage: model.confidenceLineage,
      review: model.review,
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load readiness status.");
  }
}
