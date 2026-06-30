import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceExplanationRequest, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await replayGovernanceExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay governance explanation.");
  }
}
