import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { ConservativeExampleValidator, ExampleHumanReviewService, PrismaExampleArtifactRepository, PrismaLearningAuditLedger } from "@/services/learning-constitution";
import type { LearningExample } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: Readonly<{ params: Promise<{ exampleId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to review examples.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); const { exampleId } = await context.params;
    const body = await request.json() as { action?: unknown; note?: unknown }; if ((body.action !== "APPROVE" && body.action !== "REJECT") || typeof body.note !== "string" || !body.note.trim()) throw new AppError(400, "review_invalid", "Review action and note are required.");
    const artifacts = new PrismaExampleArtifactRepository(user.workspaceId); const candidateArtifact = (await artifacts.listArtifacts(exampleId)).find((item) => item.artifactType === "CANDIDATE");
    if (!candidateArtifact) throw new AppError(404, "example_missing", "Example candidate was not found.");
    const candidate = candidateArtifact.payload as LearningExample; if (candidate.exampleId !== exampleId || candidate.status !== "CANDIDATE" || candidate.executionPermissionGranted !== false) throw new AppError(409, "example_invalid", "Stored example candidate is invalid.");
    const reviewId = `example-review:${exampleId}:${crypto.randomUUID()}`; const result = await new ExampleHumanReviewService(new ConservativeExampleValidator(), artifacts, new PrismaLearningAuditLedger(user.workspaceId)).record({ review: { reviewId, exampleId, action: body.action, actor: { actorId: `user:${user.id}`, actorType: "HUMAN" }, note: body.note.trim(), reviewedAt: new Date().toISOString(), immutable: true }, candidate }, user.workspaceId, reviewId);
    return apiSuccess(result);
  } catch (error) { return apiError(error, "Unable to review example candidate."); }
}
