import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruVaultTimelineService } from "@/src/server/services/nuru-vault-timeline-service";

export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess({ sources: await NuruVaultTimelineService.listSources(new NuruVaultPersistenceAdapter(user.workspaceId)) }); } catch (error) { return apiError(error, "Unable to load Nuru Vault sources."); } }
