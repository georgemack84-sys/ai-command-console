import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskScoringUser, validateGovernanceRiskScoreRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await validateGovernanceRiskScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Risk Score.");
  }
}
