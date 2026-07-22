import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireStrategyReplayExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyReplayExplainabilityUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect strategy replay explainability engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireStrategyReplayExplainabilityUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect strategy replay explainability engine.");
  }
}
