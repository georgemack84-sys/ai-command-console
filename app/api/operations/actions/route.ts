import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { executeOperationsAction } from "@/src/server/services/operations-action-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const result = await executeOperationsAction(await request.json(), user);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, "Unable to execute operations action.");
  }
}
