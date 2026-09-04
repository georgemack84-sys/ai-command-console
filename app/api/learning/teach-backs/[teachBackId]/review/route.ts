import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PrismaTeachBackHumanDecisionRepository, TeachBackHumanReviewService } from "@/services/learning-constitution";

const inputSchema = z.object({ action: z.enum(["APPROVE", "APPROVE_WITH_CORRECTION", "REQUEST_RETRY", "CLARIFY", "REJECT"]), note: z.string().min(1).max(20_000) }).strict();
export const dynamic = "force-dynamic";

/** Records immutable manager feedback; it does not overwrite generated evidence or grant learning authority. */
export async function POST(request: Request, context: Readonly<{ params: Promise<{ teachBackId: string }> }>) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to review teach-backs.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { teachBackId } = await context.params; const input = inputSchema.parse(await request.json());
    const decision = await new TeachBackHumanReviewService(new PrismaTeachBackHumanDecisionRepository(user.workspaceId)).record({ decisionId: `teach-back-review:${teachBackId}:${crypto.randomUUID()}`, teachBackId, action: input.action, actor: { actorId: `user:${user.id}`, actorType: "HUMAN" }, note: input.note, createdAt: new Date().toISOString(), immutable: true });
    return apiSuccess({ decision }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to record teach-back review."); }
}
