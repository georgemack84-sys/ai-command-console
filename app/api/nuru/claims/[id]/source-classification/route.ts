import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { sourceAuthorityClasses, sourceClassificationContexts } from "@/src/nuru/source-intelligence";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruSourceClassificationService } from "@/src/server/services/nuru-source-classification-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

const bodySchema = z.object({ sourceClass: z.enum(sourceAuthorityClasses), context: z.enum(sourceClassificationContexts), rationale: z.string().trim().min(3).max(2_000) });
export async function GET(_request: Request, context: RouteContext<"/api/nuru/claims/[id]/source-classification">) {
  try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { id } = await context.params; return apiSuccess({ classifications: await NuruSourceClassificationService.listForClaim(id, user.workspaceId) }); }
  catch (error) { return apiError(error, "Unable to load source classifications."); }
}
export async function PUT(request: Request, context: RouteContext<"/api/nuru/claims/[id]/source-classification">) {
  try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId }); const { id } = await context.params; return apiSuccess({ classification: await NuruSourceClassificationService.classify({ claimCandidateId: id, workspaceId: user.workspaceId, ...bodySchema.parse(await request.json()) }, `human:${user.id}`, crypto.randomUUID()) }); }
  catch (error) { return apiError(error, "Unable to classify the source for this claim."); }
}
