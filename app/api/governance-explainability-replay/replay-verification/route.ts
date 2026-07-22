import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayVerificationRequest, requireGovernanceExplainabilityReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityReplayUser();
    return apiSuccess(await replayVerificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve deterministic replay verification.");
  }
}
