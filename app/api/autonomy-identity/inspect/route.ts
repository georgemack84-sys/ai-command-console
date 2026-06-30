import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectAutonomyIdentityRequest, requireAutonomyIdentityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(await inspectAutonomyIdentityRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect autonomy identity.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAutonomyIdentityUser();
    return apiSuccess(await inspectAutonomyIdentityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect autonomy identity.");
  }
}
