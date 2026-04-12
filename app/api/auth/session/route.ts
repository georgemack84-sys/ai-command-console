import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() {
  try {
    const user = await getSessionUser();
    return apiSuccess({ user });
  } catch (error) {
    return apiError(error, "Unable to load session.");
  }
}
