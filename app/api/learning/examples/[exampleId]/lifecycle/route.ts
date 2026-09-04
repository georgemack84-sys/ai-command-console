import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { ExampleLifecycleService, PrismaExampleArtifactRepository, PrismaLearningAuditLedger } from "@/services/learning-constitution";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: Readonly<{ params: Promise<{ exampleId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to change example lifecycle.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { exampleId } = await context.params;
    const body = await request.json() as { action?: unknown; reason?: unknown; replacementExampleId?: unknown }; if ((body.action !== "INVALIDATE" && body.action !== "SUPERSEDE") || typeof body.reason !== "string" || !body.reason.trim()) throw new AppError(400, "lifecycle_invalid", "Lifecycle action and reason are required.");
    const artifacts = new PrismaExampleArtifactRepository(user.workspaceId); if (!(await artifacts.listArtifacts(exampleId)).some((item) => item.artifactType === "APPROVAL")) throw new AppError(409, "example_not_approved", "Only approved examples can be invalidated or superseded.");
    const replacementExampleId = typeof body.replacementExampleId === "string" ? body.replacementExampleId.trim() : undefined;
    if (body.action === "SUPERSEDE" && (!replacementExampleId || !(await artifacts.listArtifacts(replacementExampleId)).some((item) => item.artifactType === "APPROVAL"))) throw new AppError(409, "replacement_not_approved", "Supersession requires an approved replacement example.");
    const decisionId = `example-lifecycle:${exampleId}:${crypto.randomUUID()}`; const result = await new ExampleLifecycleService(artifacts, new PrismaLearningAuditLedger(user.workspaceId)).record({ decisionId, action: body.action, exampleId, replacementExampleId, actor: { actorId: `user:${user.id}`, actorType: "HUMAN" }, reason: body.reason.trim(), decidedAt: new Date().toISOString(), immutable: true, parentMutationAuthorized: false, executionPermissionGranted: false }, user.workspaceId, decisionId);
    return apiSuccess(result);
  } catch (error) { return apiError(error, "Unable to update example lifecycle."); }
}
