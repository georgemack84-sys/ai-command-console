import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireGovernanceExplainabilityReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceExplainabilityReplayUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance explainability replay.");
  }
}
