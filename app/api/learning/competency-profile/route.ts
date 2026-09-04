import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLatestCompetencyProfile } from "@/src/server/learning/assessment-session-service";

const querySchema = z.object({ skill_id: z.string().min(1) });

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const { skill_id } = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return apiSuccess({ profile: await getLatestCompetencyProfile(user.id, skill_id) });
  } catch (error) {
    return apiError(error, "Unable to load competency profile.");
  }
}
