import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireComplianceEvaluationUser, validateComplianceEvaluationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(await validateComplianceEvaluationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Compliance Evaluation.");
  }
}
