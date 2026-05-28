import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { listRecoveryVerificationsForExecution } from "@/services/recoveryVerification/verificationLedger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ executionId: string }> }) {
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
      permission: "recovery:verify",
      action: "recovery.disputes.read",
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }
    const { executionId } = await context.params;
    const verifications = listRecoveryVerificationsForExecution(executionId);
    return apiSuccess(verifications.flatMap((verification: { disputes: string[] }) => verification.disputes));
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load recovery disputes.");
  }
}
