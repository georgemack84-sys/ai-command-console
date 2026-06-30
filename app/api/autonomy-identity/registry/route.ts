import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryAutonomyIdentityRequest, requireAutonomyIdentityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(await registryAutonomyIdentityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build autonomy identity registry.");
  }
}
