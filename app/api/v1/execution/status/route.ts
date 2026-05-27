import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildRecoveryReadModel } from "@/services/recovery/recoveryReadModel";
import { ensureDefaultContractsRegistered } from "@/services/contracts/registerDefaultContracts";
import { getRegisteredContract } from "@/services/contracts/contractRegistry";
import { validateContractPayload } from "@/services/contracts/validateContract";
import { recordApiMetric } from "@/services/contracts/apiMetrics";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseSchema = z.object({
  executionId: z.string(),
  status: z.string(),
  operatorAttention: z.boolean(),
  contractVersion: z.literal("v1"),
  contractHash: z.string(),
}).strict();

export async function GET(request: Request) {
  try {
    ensureDefaultContractsRegistered();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const tenantContext = requireTenantApiContext({ request, user });
    const securityContext = createSecurityContextFromSessionUser({ user, tenantContext });

    const executionId = new URL(request.url).searchParams.get("executionId");
    if (!executionId) {
      recordApiMetric("execution.status.validation_failed", 1, tenantContext);
      throw new AppError(400, "API_VALIDATION_FAILED", "executionId is required.");
    }

    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "execution:read",
      action: "execution.status",
      resource: { executionId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const readModel = await buildRecoveryReadModel({ executionId, tenantContext });
    if (!readModel.ok) {
      recordApiMetric("execution.status.error", 1, tenantContext);
      throw new AppError(409, readModel.error, "Execution status is unavailable.");
    }

    const contract = getRegisteredContract("api.v1.execution.status.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Execution status contract is missing.");
    }

    const payload = {
      executionId: readModel.data.executionId,
      status: readModel.data.execution.status,
      operatorAttention: readModel.data.risk.requiresOperatorAttention,
      contractVersion: "v1" as const,
      contractHash: contract.hash,
    };

    const validated = validateContractPayload<typeof payload>({
      schema: responseSchema,
      payload,
      tenantScope: {
        required: true,
        tenantContext,
      },
    });
    if (!validated.ok) {
      recordApiMetric("execution.status.outbound_validation_failed", 1, tenantContext);
      throw new AppError(500, validated.error.code, validated.error.message, validated.error.details);
    }

    recordApiMetric("execution.status.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load execution status.");
  }
}
