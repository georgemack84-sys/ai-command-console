import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationExplanationRequest, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await escalationExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain escalation.");
  }
}
