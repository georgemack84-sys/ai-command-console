import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceConfidenceUser, validateComplianceConfidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceConfidenceUser();
    return apiSuccess(await validateComplianceConfidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Compliance Confidence.");
  }
}
