import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationRequest, requireStrategyImprovementProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(await recommendationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy improvement proposal recommendation.");
  }
}
