import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireGovernanceConstitutionalStrategyReviewUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await decisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance constitutional strategy decision.");
  }
}
