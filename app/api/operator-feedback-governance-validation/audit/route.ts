import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireOperatorFeedbackGovernanceValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackGovernanceValidationUser();
    return apiSuccess(await auditRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback governance audit.");
  }
}
