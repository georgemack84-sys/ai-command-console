import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAssessmentSession } from "@/src/server/learning/assessment-session-service";

export async function GET(_: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const { sessionId } = await context.params;
    return apiSuccess(await getAssessmentSession(user.id, sessionId));
  } catch (error) {
    return apiError(error, "Unable to load learning assessment.");
  }
}
