import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { NuruKnowledgeDevelopmentService, knowledgeDevelopmentInputSchema } from "@/src/server/services/nuru-knowledge-development-service";
import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const subjectId = new URL(request.url).searchParams.get("subjectId");
    if (!subjectId) throw new AppError(400, "subject_required", "A subjectId query parameter is required.");
    return apiSuccess({ developments: await NuruKnowledgeDevelopmentService.timeline(user.workspaceId, subjectId) });
  } catch (error) {
    return apiError(error, "Unable to load the knowledge timeline.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    await enforceNsiWriteRateLimit(request, { operation: "write", userId: user.id, workspaceId: user.workspaceId });
    const development = await NuruKnowledgeDevelopmentService.record(knowledgeDevelopmentInputSchema.parse(await request.json()), { workspaceId: user.workspaceId, actor: `human:${user.id}`, correlationId: crypto.randomUUID() });
    return apiSuccess({ development }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record the knowledge development.");
  }
}
