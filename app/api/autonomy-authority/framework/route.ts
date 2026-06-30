import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAutonomyAuthorityResponse, requireAutonomyAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyAuthorityUser();
    return apiSuccess(getAutonomyAuthorityResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve autonomy authority framework.");
  }
}
