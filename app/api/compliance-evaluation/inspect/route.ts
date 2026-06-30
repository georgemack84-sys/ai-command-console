import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectComplianceEvaluationRequest, requireComplianceEvaluationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(await inspectComplianceEvaluationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Evaluation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(await inspectComplianceEvaluationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Compliance Evaluation.");
  }
}
