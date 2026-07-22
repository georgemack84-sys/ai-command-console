import { apiError, apiSuccess } from "@/src/server/api/response";
import { executiveRequest, requireRiskAdaptationDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationDashboardUser();
    return apiSuccess(await executiveRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation executive report.");
  }
}
