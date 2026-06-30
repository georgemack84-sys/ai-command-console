import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceRiskScoringContract, requireGovernanceRiskScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(getGovernanceRiskScoringContract());
  } catch (error) {
    return apiError(error, "Unable to load Governance Risk Scoring contract.");
  }
}
