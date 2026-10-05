import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruBuildPackageExecutionService } from "@/src/server/services/nuru-build-package-execution-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId }); const { id } = await context.params; return apiSuccess({ event: await NuruBuildPackageExecutionService.start(id, await request.json(), `human:${user.id}`, new NuruVaultPersistenceAdapter(user.workspaceId)) }, { status: 201 }); } catch (error) { return apiError(error, "Unable to start the Codex build package."); } }
