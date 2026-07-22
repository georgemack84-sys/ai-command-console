import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternDetectionContractResponse, requirePatternDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternDetectionUser();
    return apiSuccess(getPatternDetectionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load pattern detection engine contract.");
  }
}
