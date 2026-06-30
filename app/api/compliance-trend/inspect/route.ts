import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectComplianceTrendRequest, requireComplianceTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceTrendUser();
    return apiSuccess(await inspectComplianceTrendRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Trend.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceTrendUser();
    return apiSuccess(await inspectComplianceTrendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Trend.");
  }
}
