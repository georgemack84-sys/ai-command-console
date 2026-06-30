import { apiError, apiSuccess } from "@/src/server/api/response";
import { constraintsAlternativePlanningRequest, requireAlternativePlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await constraintsAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load alternative planning constraints.");
  }
}
