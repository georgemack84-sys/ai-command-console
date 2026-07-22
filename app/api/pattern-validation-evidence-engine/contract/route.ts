import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternValidationEvidenceContractResponse, requirePatternValidationEvidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(getPatternValidationEvidenceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load pattern validation evidence contract.");
  }
}
