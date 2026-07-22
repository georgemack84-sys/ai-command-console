import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceRequest, requireOperatorPatternDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorPatternDashboardUser();
    return apiSuccess(await confidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence trend dashboard.");
  }
}
