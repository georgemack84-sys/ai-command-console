import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyIdentityResponse, requireAutonomyIdentityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(getAutonomyIdentityResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy identity framework.");
  }
}
