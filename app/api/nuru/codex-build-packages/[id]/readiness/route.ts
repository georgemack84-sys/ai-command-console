import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruBuildPackageReadinessService } from "@/src/server/services/nuru-build-package-readiness-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { id } = await context.params; return apiSuccess({ readiness: await NuruBuildPackageReadinessService.inspect(id, new NuruVaultPersistenceAdapter(user.workspaceId)) }); } catch (error) { return apiError(error, "Unable to inspect Codex build package readiness."); } }
