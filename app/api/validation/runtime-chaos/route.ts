import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildExecutiveOperationsAggregator } from "@/services/executive/executiveOperationsAggregator";
import { validateRuntimeChaos } from "@/services/validation/runtimeChaosValidation";

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
    const payload = await request.json().catch(() => ({}));
    const result = validateRuntimeChaos({
      governanceOutage: executive.governancePressure.governanceIntegrity < 0.4,
      escalationStorm: executive.governancePressure.escalationPressure > 0.75,
      dependencyCollapse: executive.governancePressure.operationalRisk > 0.75,
      replayCorruption: Boolean((payload as { replayCorrupted?: boolean }).replayCorrupted),
      containmentFailure: executive.governancePressure.containmentPressure > 0.7,
      heartbeatInstability: executive.governancePressure.operationalRisk > 0.68,
      createdAt: Date.now(),
    });
    return apiSuccess({ ok: true, advisoryOnly: true, previewOnly: true, validation: result });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to preview runtime chaos validation.");
  }
}
