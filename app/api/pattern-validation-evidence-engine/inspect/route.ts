import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectPatternValidationRequest, requirePatternValidationEvidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(await inspectPatternValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect pattern validation.");
  }
}
