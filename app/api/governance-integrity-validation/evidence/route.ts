import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceIntegrityValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireGovernanceIntegrityValidationUser();
    return apiSuccess(reportForRequest(request).evidence_package);
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity validation evidence.");
  }
}
