import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireStrategyImprovementProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay strategy improvement proposal generation.");
  }
}
