import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAssessmentRecommendation } from "@/src/server/learning/assessment-session-service";

const querySchema = z.object({ session_id: z.string().min(1) });

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const { session_id } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess({ recommendation: await getAssessmentRecommendation(user.id, session_id) });
  } catch (error) {
    return apiError(error, "Unable to load assessment recommendation.");
  }
}
