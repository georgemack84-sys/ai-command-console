import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAlternativePlanningUser, strategiesAlternativePlanningRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await strategiesAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate alternative planning strategies.");
  }
}
