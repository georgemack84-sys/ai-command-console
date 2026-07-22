import { apiError, apiSuccess } from "@/src/server/api/response";
import { recurrencePatternValidationRequest, requirePatternValidationEvidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(await recurrencePatternValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate pattern recurrence.");
  }
}
