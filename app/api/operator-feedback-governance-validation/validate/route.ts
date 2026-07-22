import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorFeedbackGovernanceValidationUser, validateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorFeedbackGovernanceValidationUser();
    return apiSuccess(await validateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate operator feedback governance.");
  }
}
