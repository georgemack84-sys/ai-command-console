import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceExplainabilityUser, riskExplanationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await riskExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain risk contribution.");
  }
}
