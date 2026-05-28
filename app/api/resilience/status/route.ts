import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadResilienceModel(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError(401, "unauthorized", "Authentication required.");
  }
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  const tenantContext = requireTenantApiContext({ request, user });
  const executive = await buildExecutiveOperationsAggregator({ tenantContext, operatorId: user.id });
  return buildConstitutionalResilienceEngine({ executiveModel: executive, nowMs: Date.now() });
}

export async function GET(request: Request) {
  try {
    const model = await loadResilienceModel(request);
    return apiSuccess({
      assessment: model.assessment,
      continuity: model.continuity,
      blockedReasons: model.blockedReasons,
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load resilience status.");
  }
}
