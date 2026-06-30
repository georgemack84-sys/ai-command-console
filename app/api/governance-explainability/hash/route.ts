import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceExplanationRequest, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await hashGovernanceExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance explanation.");
  }
}
