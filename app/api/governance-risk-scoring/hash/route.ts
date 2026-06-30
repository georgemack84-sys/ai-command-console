import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceRiskScoreRequest, requireGovernanceRiskScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await hashGovernanceRiskScoreRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Governance Risk Score.");
  }
}
