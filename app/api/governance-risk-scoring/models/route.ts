import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceRiskScoringContract, requireGovernanceRiskScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskScoringUser();
    const contract = getGovernanceRiskScoringContract();
    return apiSuccess({ model_versions: contract.model_versions, base_scores: contract.base_scores });
  } catch (error) {
    return apiError(error, "Unable to load Governance Risk Scoring models.");
  }
}
