import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionValidationReportRequest, requireRuntimeAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await executionValidationReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Execution Validation Report.");
  }
}
