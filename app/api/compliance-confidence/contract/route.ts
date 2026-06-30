import { apiError, apiSuccess } from "@/src/server/api/response";
import { getComplianceConfidenceContract, requireComplianceConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(getComplianceConfidenceContract());
  } catch (error) {
    return apiError(error, "Unable to load Compliance Confidence contract.");
  }
}
