import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionBoundaryDecisionRequest, requireExecutionBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await executionBoundaryDecisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to produce Execution Boundary decision.");
  }
}
