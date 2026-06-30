import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyIdentityUser, versionAutonomyIdentityResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(versionAutonomyIdentityResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy identity version policy.");
  }
}
