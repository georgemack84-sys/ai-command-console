import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAutonomyAuthorityRequest, requireAutonomyAuthorityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyAuthorityUser();
    return apiSuccess(await replayAutonomyAuthorityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay autonomy authority decisions.");
  }
}
