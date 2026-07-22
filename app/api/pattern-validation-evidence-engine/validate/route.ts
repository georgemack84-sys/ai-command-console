import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternValidationEvidenceUser, validatePatternEvidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(await validatePatternEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate pattern evidence.");
  }
}
