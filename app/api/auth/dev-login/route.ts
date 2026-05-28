import { authenticateUser, setSessionCookie } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";

const DEV_DEMO_EMAIL = "operator@pulse.local";
const DEV_DEMO_PASSWORD = "demo-password";

function devLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}

export async function POST() {
  try {
    if (!devLoginEnabled()) {
      throw new AppError(404, "not_found", "Not found.");
    }

    const result = await authenticateUser(DEV_DEMO_EMAIL, DEV_DEMO_PASSWORD);
    if ("error" in result) {
      throw new AppError(401, "invalid_credentials", result.error || "Invalid email or password.");
    }

    await setSessionCookie(result.user);
    return apiSuccess({ user: result.user });
  } catch (error) {
    return apiError(error, "Unable to sign in with the local demo account.");
  }
}
