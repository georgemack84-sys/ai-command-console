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
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { verifyPersistedBackupIntegrity } from "@/services/continuity/backupIntegrity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({ snapshotId: z.string().optional() }).strict();
const responseSchema = z.object({
  ready: z.boolean(),
  issues: z.array(z.string()),
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
    const parsed = validateContractPayload<{ snapshotId?: string }>({
      schema: requestSchema,
      payload: await request.json().catch(() => ({})),
      tenantScope: { required: true, tenantContext },
    });
    if (!parsed.ok) {
      throw new AppError(400, parsed.error.code, parsed.error.message, parsed.error.details);
    }
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "integrity:verify",
      action: "integrity.check",
      resource: { snapshotId: parsed.data.snapshotId || null },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }
    const result = await verifyPersistedBackupIntegrity({ tenantContext, snapshotId: parsed.data.snapshotId });
    if (!result.ok) {
      recordApiMetric("integrity.check.failed", 1, tenantContext);
      throw new AppError(409, result.error.code, result.error.message, result.error.details);
    }
    const contract = getRegisteredContract("api.v1.integrity.report.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Integrity report contract is missing.");
    }
    const payload = {
      ready: result.data.ready,
      issues: result.data.issues,
      contractVersion: "v1" as const,
      contractHash: contract.hash,
    };
    const validated = validateContractPayload<typeof payload>({
      schema: responseSchema,
      payload,
      tenantScope: { required: true, tenantContext },
    });
    if (!validated.ok) {
      throw new AppError(500, validated.error.code, validated.error.message, validated.error.details);
    }
    recordApiMetric("integrity.check.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to verify integrity.");
  }
}
