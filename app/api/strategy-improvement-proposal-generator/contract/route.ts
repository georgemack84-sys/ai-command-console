import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategyImprovementProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy improvement proposal contract.");
  }
}
