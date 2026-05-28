import { z } from "zod";

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
import { getSamQueueGovernorSnapshot } from "@/services/sam/scaling/samQueueGovernor";
import { loadSamRuntimeLimits } from "@/services/sam/scaling/samRuntimeLimits";
import { determineSamDegradedMode } from "@/services/sam/scaling/samDegradedMode";
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseSchema = z.object({
  mode: z.enum(["NORMAL", "ELEVATED", "THROTTLED", "DEGRADED", "RESTRICTED", "FROZEN"]),
  queueDepth: z.number(),
  degraded: z.boolean(),
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

    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "execution:read",
      action: "mission.state",
      resource: { workspaceId: tenantContext.workspaceId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const snapshot = getSamQueueGovernorSnapshot();
    const mode = determineSamDegradedMode({
      ...snapshot,
      limits: loadSamRuntimeLimits(),
    });

    const contract = getRegisteredContract("api.v1.mission.state.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Mission state contract is missing.");
    }

    const payload = {
      mode,
      queueDepth: snapshot.queueDepth,
      degraded: mode !== "NORMAL",
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
      recordApiMetric("mission.state.outbound_validation_failed", 1, tenantContext);
      throw new AppError(500, validated.error.code, validated.error.message, validated.error.details);
    }

    if (mode !== "NORMAL") {
      recordApiMetric("mission.state.degraded_response", 1, tenantContext);
    }
    recordApiMetric("mission.state.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load mission state.");
  }
}
