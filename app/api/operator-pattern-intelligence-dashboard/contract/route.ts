import { apiError, apiSuccess } from "@/src/server/api/response";
import { getOperatorPatternDashboardContractResponse, requireOperatorPatternDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorPatternDashboardUser();
    return apiSuccess(getOperatorPatternDashboardContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator pattern dashboard contract.");
  }
}
