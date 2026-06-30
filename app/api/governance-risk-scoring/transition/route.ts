import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskScoringUser, transitionGovernanceRiskScoreRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await transitionGovernanceRiskScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to transition Governance Risk Score.");
  }
}
