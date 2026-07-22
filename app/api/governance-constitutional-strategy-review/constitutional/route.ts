import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalRequest, requireGovernanceConstitutionalStrategyReviewUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await constitutionalRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional strategy review findings.");
  }
}
