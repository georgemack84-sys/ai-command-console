import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceAuthorityBoundaryValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireGovernanceAuthorityBoundaryValidationUser();
    return apiSuccess(reportForRequest(request).truth_ledger_record);
  } catch (error) {
    return apiError(error, "Unable to retrieve authority boundary validation ledger record.");
  }
}
