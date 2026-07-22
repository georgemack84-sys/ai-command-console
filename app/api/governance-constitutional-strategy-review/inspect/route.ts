import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireGovernanceConstitutionalStrategyReviewUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance constitutional strategy review.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance constitutional strategy review.");
  }
}
