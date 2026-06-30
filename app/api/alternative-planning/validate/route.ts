import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAlternativePlanningUser, validateAlternativePlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await validateAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate alternative planning package.");
  }
}
