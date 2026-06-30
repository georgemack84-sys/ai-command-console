import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayComplianceTrendRequest, requireComplianceTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceTrendUser();
    return apiSuccess(await replayComplianceTrendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Compliance Trend.");
  }
}
