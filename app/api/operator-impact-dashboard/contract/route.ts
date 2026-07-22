import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOperatorImpactDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOperatorImpactDashboardUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve operator impact dashboard contract.");
  }
}
