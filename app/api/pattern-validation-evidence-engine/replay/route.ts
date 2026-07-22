import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternValidationRequest, requirePatternValidationEvidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(await replayPatternValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern validation.");
  }
}
