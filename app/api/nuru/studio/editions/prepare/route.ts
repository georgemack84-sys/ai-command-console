import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { prepareTomorrowEdition } from "@/src/server/services/nuru-edition-service";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to prepare a Nuru edition.");
    if (user.role !== "admin") throw new AppError(403, "forbidden", "Nuru editions are available to editors only.");
    return apiSuccess(await prepareTomorrowEdition());
  } catch (error) { return apiError(error, "Unable to prepare tomorrow’s edition."); }
}
