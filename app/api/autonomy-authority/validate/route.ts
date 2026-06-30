import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomyAuthorityUser, validateAutonomyAuthorityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyAuthorityUser();
    return apiSuccess(await validateAutonomyAuthorityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate autonomy authority.");
  }
}
