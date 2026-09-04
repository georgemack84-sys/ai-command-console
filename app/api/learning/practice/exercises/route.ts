import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { PracticeArtifactService, PracticeExerciseGenerationService, PrismaLearningAuditLedger, PrismaPracticeArtifactRepository } from "@/services/learning-constitution";
import type { PracticeExercise, PracticeExerciseGenerationRequest } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

const workspaceUser = async () => { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "Workspace membership is required."); await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; };

export async function GET() {
  try { const user = await workspaceUser(); const artifacts = await new PrismaPracticeArtifactRepository(user.workspaceId!).listWorkspaceArtifacts(); return apiSuccess({ exercises: artifacts.filter((artifact) => artifact.artifactType === "EXERCISE").map((artifact) => artifact.payload as PracticeExercise) }); }
  catch (error) { return apiError(error, "Unable to load practice exercises."); }
}

export async function POST(request: Request) {
  try {
    const user = await workspaceUser(); const body = await request.json() as { request?: PracticeExerciseGenerationRequest; priorExercises?: PracticeExercise[] };
    if (!body.request || typeof body.request !== "object") throw new AppError(400, "practice_request_invalid", "A constrained exercise-generation request is required.");
    const generatedAt = new Date().toISOString();
    const generated = new PracticeExerciseGenerationService().generate({ ...body.request, generation: { ...body.request.generation, generatedAt, generatedBy: { actorId: `user:${user.id}`, actorType: "HUMAN" } } }, body.priorExercises ?? []);
    const repository = new PrismaPracticeArtifactRepository(user.workspaceId!);
    await new PracticeArtifactService(repository, new PrismaLearningAuditLedger(user.workspaceId!)).createExercise(generated.exercise, generated.evaluationSpec, user.workspaceId!, `practice-exercise:${generated.exercise.exerciseId}`);
    return apiSuccess({ exercise: generated.exercise }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to generate practice exercise."); }
}
