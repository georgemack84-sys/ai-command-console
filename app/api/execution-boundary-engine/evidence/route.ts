import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionBoundaryEvidenceRequest, requireExecutionBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExecutionBoundaryUser();
    return apiSuccess(await executionBoundaryEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Execution Boundary evidence.");
  }
}
