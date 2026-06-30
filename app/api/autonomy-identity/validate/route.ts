import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyIdentityUser, validateAutonomyIdentityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(await validateAutonomyIdentityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate autonomy identity.");
  }
}
