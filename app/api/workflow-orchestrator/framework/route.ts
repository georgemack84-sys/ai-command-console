import { apiError, apiSuccess } from "@/src/server/api/response";
import { getWorkflowOrchestratorResponse, requireWorkflowOrchestratorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(getWorkflowOrchestratorResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve workflow orchestrator framework.");
  }
}
