import { apiError, apiSuccess } from "@/src/server/api/response";
import { getComplianceEvaluationContract, requireComplianceEvaluationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(getComplianceEvaluationContract());
  } catch (error) {
    return apiError(error, "Unable to load Compliance Evaluation contract.");
  }
}
