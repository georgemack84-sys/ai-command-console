import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAlternativePlanningResponse, requireAlternativePlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(getAlternativePlanningResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve alternative planning framework.");
  }
}
