import { apiError, apiSuccess } from "@/src/server/api/response";
import { activateWorkflowRequest, requireWorkflowOrchestratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(await activateWorkflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to activate workflow.");
  }
}
