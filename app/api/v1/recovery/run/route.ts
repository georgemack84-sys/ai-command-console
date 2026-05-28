import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { getRecoveryOperatorView } from "@/controllers/recoveryOperatorController";
import { ensureDefaultContractsRegistered } from "@/services/contracts/registerDefaultContracts";
import { getRegisteredContract } from "@/services/contracts/contractRegistry";
import { validateContractPayload } from "@/services/contracts/validateContract";
import { recordApiMetric } from "@/services/contracts/apiMetrics";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  executionId: z.string(),
}).strict();

const responseSchema = z.object({
  executionId: z.string(),
  dryRun: z.literal(true),
  timelineMatchesReadModel: z.boolean(),
  contractVersion: z.literal("v1"),
  contractHash: z.string(),
}).strict();

export async function POST(request: Request) {
  try {
    ensureDefaultContractsRegistered();
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
      recordApiMetric("recovery.run.validation_failed", 1, tenantContext);
      throw new AppError(400, parsed.error.code, parsed.error.message, parsed.error.details);
    }

    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "recovery:run",
      action: "recovery.preview",
      resource: { executionId: parsed.data.executionId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const operatorView = await getRecoveryOperatorView({ executionId: parsed.data.executionId, tenantContext });
    if (!operatorView.ok) {
      recordApiMetric("recovery.run.error", 1, tenantContext);
      throw new AppError(409, operatorView.error, operatorView.reason || "Recovery preview is unavailable.");
    }

    const contract = getRegisteredContract("api.v1.recovery.run.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Recovery run contract is missing.");
    }

    const payload = {
      executionId: parsed.data.executionId,
      dryRun: true as const,
      timelineMatchesReadModel: operatorView.data.timelineMatchesReadModel,
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
      recordApiMetric("recovery.run.outbound_validation_failed", 1, tenantContext);
      throw new AppError(500, validated.error.code, validated.error.message, validated.error.details);
    }

    recordApiMetric("recovery.run.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to prepare recovery dry-run.");
  }
}
