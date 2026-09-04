import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { learningAgentPreflight, withLearningAgentCors } from "@/src/server/api/learning-agent-cors";
import { generateLearningPlan } from "@/src/server/learning/curriculum-plan-service";

const schema = z.object({ goal: z.object({ skill_id: z.string().min(1).optional(), free_text: z.string().min(1), target_level: z.enum(["FOUNDATIONAL", "PRACTICAL", "TROUBLESHOOTING"]).optional() }), constraints: z.object({ available_minutes_per_week: z.number().int().positive().optional(), target_date: z.string().date().optional(), preferred_session_minutes: z.number().int().positive().optional(), excluded_topics: z.array(z.string().min(1)).optional() }).default({}) });
export function OPTIONS(request: Request) { return learningAgentPreflight(request); }
export async function POST(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); return withLearningAgentCors(apiSuccess({ plan: await generateLearningPlan(user.id, schema.parse(await request.json())) }, { status: 201 }), request); } catch (error) { return withLearningAgentCors(apiError(error, "Unable to generate learning plan."), request); } }
