import { apiError, apiSuccess } from "@/src/server/api/response";
import { patternsRequest, requireFeedbackEvidenceCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackEvidenceCorrelationUser();
    return apiSuccess(await patternsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern correlation.");
  }
}
