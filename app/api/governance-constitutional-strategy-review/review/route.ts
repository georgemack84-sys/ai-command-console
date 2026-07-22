import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceConstitutionalStrategyReviewUser, reviewRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await reviewRequest(request));
  } catch (error) {
    return apiError(error, "Unable to review governance constitutional strategy proposal.");
  }
}
