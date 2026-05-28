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
import { createSecurityContextFromSessionUser } from "@/services/security/securityContext";
import { authorizeSecurityAction } from "@/services/security/authorizationGuard";
import { getLatestBackupStatus } from "@/services/continuity/snapshotCoordinator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseSchema = z.object({
  snapshotId: z.string(),
  status: z.enum(["ready", "partial", "corrupted", "missing"]),
  generatedAt: z.string().optional(),
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
      permission: "backup:read",
      action: "backup.status",
    });
    if (!authorization.ok) {
      throw new AppError(403, authorization.error.code, authorization.error.message, authorization.error.details);
    }
    const contract = getRegisteredContract("api.v1.backup.status.response", "1.0.0");
    if (!contract) {
      throw new AppError(500, "API_CONTRACT_MISSING", "Backup status contract is missing.");
    }
    const status = getLatestBackupStatus(tenantContext);
    const payload = {
      snapshotId: status.snapshotId,
      status: status.status,
      generatedAt: status.generatedAt,
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
    return apiSuccess(validated.data);
  } catch (error) {
    return apiError(normalizeTenantApiError(error), "Unable to load backup status.");
  }
}
