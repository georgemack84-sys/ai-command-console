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

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const executive = await buildExecutiveOperationsAggregator({ tenantContext, operatorId: user.id });
    const resilience = buildConstitutionalResilienceEngine({ executiveModel: executive, nowMs: Date.now() });

    return apiSuccess({
      advisoryOnly: true,
      mutationApplied: false,
      recommendedActions: resilience.emergencyContinuity.recommendedActions,
      blockedReasons: resilience.blockedReasons,
      audit: resilience.audit,
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to validate resilience stabilization.");
  }
}
