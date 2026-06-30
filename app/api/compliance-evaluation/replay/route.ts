import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayComplianceEvaluationRequest, requireComplianceEvaluationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(await replayComplianceEvaluationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Compliance Evaluation.");
  }
}
