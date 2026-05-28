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
import { createBackupSnapshot } from "@/services/continuity/snapshotCoordinator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({}).strict();
const responseSchema = z.object({
  snapshotId: z.string(),
  status: z.enum(["ready", "partial", "corrupted", "missing"]),
  generatedAt: z.string().optional(),
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

    const parsed = validateContractPayload({
      schema: requestSchema,
      payload: await request.json().catch(() => ({})),
      tenantScope: { required: true, tenantContext },
    });
    if (!parsed.ok) {
      throw new AppError(400, parsed.error.code, parsed.error.message, parsed.error.details);
    }

    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "backup:create",
      action: "backup.create",
      resource: { tenantId: tenantContext.tenantId, workspaceId: tenantContext.workspaceId },
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }

    const created = await createBackupSnapshot({ tenantContext, persist: true });
    if (!created.ok) {
      recordApiMetric("backup.create.failed", 1, tenantContext);
      throw new AppError(409, created.error.code, created.error.message);
    }

    const contract = getRegisteredContract("api.v1.backup.create.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Backup create contract is missing.");
    }

    const payload = {
      snapshotId: created.data.manifest.snapshotId,
      status:
        created.data.manifest.completeness === "complete"
          ? "ready"
          : created.data.manifest.completeness === "partial" || created.data.manifest.completeness === "corrupted"
            ? created.data.manifest.completeness
            : "ready",
      generatedAt: created.data.manifest.generatedAt,
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

    recordApiMetric("backup.create.success", 1, tenantContext);
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to create backup snapshot.");
  }
}
