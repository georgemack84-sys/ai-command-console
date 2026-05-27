import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { getRuntimeContinuityState } from "@/services/runtime/runtimeContinuityState";
import { createRuntimeContinuitySnapshot } from "@/services/runtime/continuitySnapshot";
import { AppError } from "@/src/server/api/errors";

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
    const securityContext = createSecurityContextFromSessionUser({ user, tenantContext });
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "execution:read",
      action: "runtime.risk.read",
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }
    const state = getRuntimeContinuityState({ tenantContext });
    if (!state.ok) {
      throw new AppError(409, state.error.code, state.error.message, state.error.details);
    }
    const snapshot = createRuntimeContinuitySnapshot({ tenantContext, persist: false });
    return apiSuccess({
      runtimeState: state.data.runtimeState,
      continuityConfidence: state.data.continuityConfidence,
      continuityRiskScore: snapshot.continuityRiskScore,
      survivabilityScore: state.data.survivabilityScore,
      replayDivergenceDetected: state.data.replayDivergenceDetected,
      updatedAt: state.data.updatedAt,
    });
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load runtime continuity risk.");
  }
}
