import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceExplanationRequest, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await inspectGovernanceExplanationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance explanation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(await inspectGovernanceExplanationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance explanation.");
  }
}
