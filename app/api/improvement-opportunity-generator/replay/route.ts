import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayImprovementOpportunityRequest, requireImprovementOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireImprovementOpportunityUser();
    return apiSuccess(await replayImprovementOpportunityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay improvement opportunity generation.");
  }
}
