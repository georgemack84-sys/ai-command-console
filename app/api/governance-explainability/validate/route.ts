import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceExplainabilityUser, validateGovernanceExplanationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await validateGovernanceExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance explanation.");
  }
}
