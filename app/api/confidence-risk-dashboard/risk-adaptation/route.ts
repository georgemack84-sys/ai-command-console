import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceRiskDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskDashboardUser();
    return apiSuccess(await sectionRequest(request, "risk_adaptation_view"));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation view.");
  }
}
