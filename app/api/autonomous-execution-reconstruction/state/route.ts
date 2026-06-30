import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionStateReplayRequest, requireExecutionReconstructionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionReconstructionUser();
    return apiSuccess(await executionStateReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build execution state replay.");
  }
}
