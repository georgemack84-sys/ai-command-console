import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessRequest, requireForecastConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireForecastConfidenceUser();
    return apiSuccess(await assessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to assess forecast confidence.");
  }
}
