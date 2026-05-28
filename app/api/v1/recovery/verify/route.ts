import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { validateContractPayload } from "@/services/contracts/validateContract";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { runRecoveryVerificationEngine } from "@/services/recoveryVerification/recoveryVerificationEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  executionId: z.string(),
}).strict();

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const securityContext = createSecurityContextFromSessionUser({ user, tenantContext });
    const parsed = validateContractPayload<{ executionId: string }>({
      schema: requestSchema,
      payload: await request.json(),
      tenantScope: {
        required: true,
        tenantContext,
      },
    });
    if (!parsed.ok) {
      throw new AppError(400, parsed.error.code, parsed.error.message, parsed.error.details);
    }
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "recovery:verify",
      action: "recovery.verify",
      resource: { executionId: parsed.data.executionId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const result = await runRecoveryVerificationEngine({
      executionId: parsed.data.executionId,
      tenantContext,
      securityContext,
    });
    if (!result.ok) {
      throw new AppError(409, result.error.code, result.error.message, result.error.details);
    }
    return apiSuccess(result.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to verify recovery outcome.");
  }
}
