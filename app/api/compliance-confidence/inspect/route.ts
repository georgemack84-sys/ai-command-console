import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectComplianceConfidenceRequest, requireComplianceConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(await inspectComplianceConfidenceRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Confidence.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(await inspectComplianceConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Confidence.");
  }
}
