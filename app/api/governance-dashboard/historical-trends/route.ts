import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceDashboardViewRequest, requireGovernanceDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireGovernanceDashboardUser();
    return apiSuccess((await getGovernanceDashboardViewRequest(request)).historical_trends);
  } catch (error) {
    return apiError(error, "Unable to retrieve governance historical trends.");
  }
}
