import { apiError, apiSuccess } from "@/src/server/api/response";
import { catalogAlternativePlanningRequest, requireAlternativePlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAlternativePlanningUser();
    return apiSuccess(await catalogAlternativePlanningRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build alternative planning catalog.");
  }
}
