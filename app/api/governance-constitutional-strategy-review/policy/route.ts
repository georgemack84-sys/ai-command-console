import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireGovernanceConstitutionalStrategyReviewUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceConstitutionalStrategyReviewUser();
    return apiSuccess(await policyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve policy strategy review findings.");
  }
}
