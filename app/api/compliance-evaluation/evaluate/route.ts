import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateComplianceRequest, requireComplianceEvaluationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceEvaluationUser();
    return apiSuccess(await evaluateComplianceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate Compliance.");
  }
}
