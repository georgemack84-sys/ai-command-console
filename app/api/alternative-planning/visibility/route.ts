import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAlternativePlanningUser, visibilityAlternativePlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await visibilityAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build alternative planning visibility surface.");
  }
}
