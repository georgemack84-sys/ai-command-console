import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { validateSovereigntySurvivability } from "@/services/validation/survivabilityValidation";

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
    const result = validateSovereigntySurvivability({
      survivabilityConfidence: executive.controlPlane.sovereignty.survivabilityConfidence,
      governanceReliability: executive.controlPlane.sovereignty.governanceIntegrity,
      containmentIntegrity: executive.controlPlane.sovereignty.containmentEffectiveness,
      operationalStability: 1 - executive.governancePressure.operationalRisk,
      disputedSystems: executive.constraints.blockedReasons,
      immutableAuditVerified: true,
      createdAt: Date.now(),
    });
    return apiSuccess({ ok: true, advisoryOnly: true, previewOnly: true, validation: result });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to preview survivability validation.");
  }
}
