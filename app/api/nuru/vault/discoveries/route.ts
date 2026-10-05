import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruVaultCanonicalProjectionService } from "@/src/server/services/nuru-vault-canonical-projection-service";

/** Dynamic, workspace-scoped retrieval endpoint. It exposes only canonical projection data. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const vault = new NuruVaultPersistenceAdapter(user.workspaceId);
    const projection = await NuruVaultCanonicalProjectionService.rebuild(vault);
    const discoveries = await NuruVaultCanonicalProjectionService.listDiscoveryView(vault, projection);
    return apiSuccess({ revision: projection.revision, discoveries });
  } catch (error) {
    return apiError(error, "Unable to load Nuru Vault discoveries.");
  }
}
