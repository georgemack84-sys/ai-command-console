import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { learningAgentPreflight, withLearningAgentCors } from "@/src/server/api/learning-agent-cors";
import { getCurrentLearningPlan } from "@/src/server/learning/curriculum-plan-service";
export function OPTIONS(request: Request) { return learningAgentPreflight(request); }
export async function GET(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); return withLearningAgentCors(apiSuccess({ plan: await getCurrentLearningPlan(user.id) }), request); } catch (error) { return withLearningAgentCors(apiError(error, "Unable to load learning plan."), request); } }
