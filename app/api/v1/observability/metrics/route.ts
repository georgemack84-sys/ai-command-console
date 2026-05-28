import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { normalizeTenantApiError } from "@/src/server/api/tenantApiErrors";
import { requireTenantApiContext } from "@/src/server/api/tenantApiContext";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { ensureDefaultContractsRegistered } from "@/services/contracts/registerDefaultContracts";
import { getRegisteredContract } from "@/services/contracts/contractRegistry";
import { validateContractPayload } from "@/services/contracts/validateContract";
import { recordApiMetric } from "@/services/contracts/apiMetrics";
import { buildMetricSnapshot } from "@/services/observability/metricSnapshot";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "execution:read",
      action: "observability.metrics",
      resource: { executionId: new URL(request.url).searchParams.get("executionId") || null },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const executionId = new URL(request.url).searchParams.get("executionId") || undefined;
    const generatedAt = new Date().toISOString();
    const snapshot = await buildMetricSnapshot({ generatedAt, executionId, tenantContext });
    const contract = getRegisteredContract("api.v1.observability.metrics.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Observability metrics contract is missing.");
    }

    const payload = {
      ...snapshot,
      contractVersion: "v1" as const,
      contractHash: contract.hash,
    };

    const validated = validateContractPayload<typeof payload>({
      schema: contract.schema,
      payload,
      tenantScope: {
        required: true,
        tenantContext,
      },
    });
    if (!validated.ok) {
      recordApiMetric("observability.metrics.outbound_validation_failed", 1, tenantContext);
      throw new AppError(500, validated.error.code, validated.error.message, validated.error.details);
    }

    if (snapshot.healthStatus !== "HEALTHY") {
      recordApiMetric("observability.metrics.degraded_response", 1, tenantContext);
    }
    recordApiMetric("observability.metrics.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load observability metrics.");
  }
}
