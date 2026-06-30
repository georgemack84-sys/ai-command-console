import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkflowOrchestratorUser, visibilityWorkflowRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireWorkflowOrchestratorUser();
    return apiSuccess(await visibilityWorkflowRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build workflow orchestration visibility surface.");
  }
}
