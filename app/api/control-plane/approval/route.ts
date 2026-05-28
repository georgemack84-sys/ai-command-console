import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildConstitutionalOperatorControlPlane } from "@/services/controlPlane/constitutionalOperatorControlPlane";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const model = await buildConstitutionalOperatorControlPlane({ tenantContext });
    return apiSuccess({
      approvalPackets: model.approvalPackets,
      blockedReasons: ["OPERATOR_ACTION_NOT_AUTHORIZED"],
      message: "Approval submission is unavailable in this read-dominant phase.",
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load approval packets.");
  }
}
