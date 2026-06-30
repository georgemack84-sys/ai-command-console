import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionExplanationRequest, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await decisionExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain governance decision.");
  }
}
