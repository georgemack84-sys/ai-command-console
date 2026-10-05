import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { nuruPersonalEditionFeedbackSchema, recordNuruPersonalEditionFeedback } from "@/src/server/services/nuru-personal-edition-feedback-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to shape your Nuru edition.");
    return apiSuccess(await recordNuruPersonalEditionFeedback(user.id, nuruPersonalEditionFeedbackSchema.parse(await request.json())));
  } catch (error) {
    return apiError(error, "Nuru could not record that feedback.");
  }
}
