import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { learningAgentPreflight, withLearningAgentCors } from "@/src/server/api/learning-agent-cors";
import { recordLearningPlanEvent } from "@/src/server/learning/curriculum-plan-service";

const schema = z.object({ type: z.enum(["STARTED", "COMPLETED", "SKIPPED"]) });
export function OPTIONS(request: Request) { return learningAgentPreflight(request); }
export async function POST(request: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); const { id, lessonId } = await params; await recordLearningPlanEvent(user.id, id, lessonId, schema.parse(await request.json()).type); return withLearningAgentCors(apiSuccess({ recorded: true }), request); } catch (error) { return withLearningAgentCors(apiError(error, "Unable to record learning-plan progress."), request); } }
