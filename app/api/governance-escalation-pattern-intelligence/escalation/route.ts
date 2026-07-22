import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationRecommendationsRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await escalationRecommendationsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation recommendations.");
  }
}
