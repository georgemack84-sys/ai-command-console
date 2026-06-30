import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceRiskScoreRequest, requireGovernanceRiskScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await replayGovernanceRiskScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Governance Risk Score.");
  }
}
