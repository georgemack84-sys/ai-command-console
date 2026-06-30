import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkflowOrchestratorUser, stateWorkflowRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(await stateWorkflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve workflow state.");
  }
}
