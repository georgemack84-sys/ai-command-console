import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkflowOrchestratorUser, synchronizationWorkflowRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(await synchronizationWorkflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve workflow synchronization state.");
  }
}
