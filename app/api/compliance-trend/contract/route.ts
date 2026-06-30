import { apiError, apiSuccess } from "@/src/server/api/response";
import { getComplianceTrendContract, requireComplianceTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceTrendUser();
    return apiSuccess(getComplianceTrendContract());
  } catch (error) {
    return apiError(error, "Unable to load Compliance Trend contract.");
  }
}
