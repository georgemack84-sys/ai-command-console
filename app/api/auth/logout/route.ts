import { clearSessionCookie } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST() {
  try {
    await clearSessionCookie();
    return apiSuccess({ loggedOut: true });
  } catch (error) {
    return apiError(error, "Unable to log out.");
  }
}
