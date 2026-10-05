import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruSourceRegistryService } from "@/src/server/services/nuru-source-registry-service";
import { NuruVaultSourceIntakeService, vaultSourceIntakeSchema } from "@/src/server/services/nuru-vault-source-intake-service";
import { readJsonWithinLimit } from "@/src/server/security/request-body-limit";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

/** Manager-only intake endpoint. All source policy is resolved from the approved registry. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const payload = await readJsonWithinLimit(request, 10 * 1024 * 1024);
    const vault = new NuruVaultPersistenceAdapter(user.workspaceId);
    const result = await NuruVaultSourceIntakeService.intake(vaultSourceIntakeSchema.parse(payload), { workspaceId: user.workspaceId, actor: `human:${user.id}`, correlationId: crypto.randomUUID() }, NuruSourceRegistryService, vault);
    return apiSuccess(result, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to intake Nuru Vault source material.");
  }
}
