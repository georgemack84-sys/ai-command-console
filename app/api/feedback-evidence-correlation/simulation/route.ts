import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFeedbackEvidenceCorrelationUser, simulationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackEvidenceCorrelationUser();
    return apiSuccess(await simulationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation correlation.");
  }
}
