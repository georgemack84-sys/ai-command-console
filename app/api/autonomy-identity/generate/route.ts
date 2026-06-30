import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateAutonomyIdentityRequest, requireAutonomyIdentityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(await generateAutonomyIdentityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate autonomy identity.");
  }
}
