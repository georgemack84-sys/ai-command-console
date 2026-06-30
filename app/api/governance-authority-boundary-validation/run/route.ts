import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceAuthorityBoundaryValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireGovernanceAuthorityBoundaryValidationUser();
    return apiSuccess(reportForRequest(request).validation_run);
  } catch (error) {
    return apiError(error, "Unable to run authority boundary validation.");
  }
}
