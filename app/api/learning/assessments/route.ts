import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { isFeatureEnabled } from "@/src/server/feature-flags/feature-flag-service";
import { startOrResumeAssessment, toLearnerAssessmentSession } from "@/src/server/learning/assessment-session-service";

const startSchema = z.object({ skill_id: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!await isFeatureEnabled("skill_graph_v1", user.workspaceId) || !await isFeatureEnabled("assessment_engine_v1", user.workspaceId)) throw new AppError(403, "feature_disabled", "Learning assessments are not enabled for this workspace.");
    const { skill_id } = startSchema.parse(await request.json());
    const result = await startOrResumeAssessment(user.id, skill_id);
    return apiSuccess({ session: toLearnerAssessmentSession(result.session), resumed: result.resumed }, { status: result.resumed ? 200 : 201 });
  } catch (error) {
    return apiError(error, "Unable to start learning assessment.");
  }
}
