import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayComplianceConfidenceRequest, requireComplianceConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(await replayComplianceConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Compliance Confidence.");
  }
}
