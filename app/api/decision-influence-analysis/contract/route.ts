import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDecisionInfluenceContractResponse, requireDecisionInfluenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDecisionInfluenceUser();
    return apiSuccess(getDecisionInfluenceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve DecisionInfluenceAnalysis contract.");
  }
}
