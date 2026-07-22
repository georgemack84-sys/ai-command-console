import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireRiskAdaptationDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationDashboardUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay risk adaptation dashboards.");
  }
}
