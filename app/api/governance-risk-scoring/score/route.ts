import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskScoringUser, scoreGovernanceRiskRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskScoringUser();
    return apiSuccess(await scoreGovernanceRiskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to score Governance Risk.");
  }
}
