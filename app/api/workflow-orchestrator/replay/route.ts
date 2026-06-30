import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayWorkflowRequest, requireWorkflowOrchestratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(await replayWorkflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay workflow orchestration.");
  }
}
