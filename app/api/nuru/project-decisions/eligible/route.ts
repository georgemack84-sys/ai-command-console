import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruProjectDecisionService } from "@/src/server/services/nuru-project-decision-service";

export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return apiSuccess({ approvals: await NuruProjectDecisionService.listEligibleApprovals(new NuruVaultPersistenceAdapter(user.workspaceId)) }); } catch (error) { return apiError(error, "Unable to load eligible project-decision approvals."); } }
