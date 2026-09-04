import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { completeAssessmentSession, toLearnerAssessmentSession } from "@/src/server/learning/assessment-session-service";

export async function POST(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const { sessionId } = await context.params;
    return apiSuccess({ session: toLearnerAssessmentSession(await completeAssessmentSession(user.id, sessionId)) });
  } catch (error) {
    return apiError(error, "Unable to complete learning assessment.");
  }
}
