import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryPatternValidationRequest, requirePatternValidationEvidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternValidationEvidenceUser();
    return apiSuccess(await registryPatternValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern validation registry.");
  }
}
