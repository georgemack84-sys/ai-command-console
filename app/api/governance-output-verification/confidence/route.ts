import { apiError, apiSuccess } from "@/src/server/api/response";
import { comparisonRequest, requireGovernanceOutputVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(await comparisonRequest(request, "confidence_comparison"));
  } catch (error) {
    return apiError(error, "Unable to compare confidence outputs.");
  }
}
