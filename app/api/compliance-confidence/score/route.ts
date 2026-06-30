import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceConfidenceUser, scoreComplianceConfidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(await scoreComplianceConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to score Compliance Confidence.");
  }
}
