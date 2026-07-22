import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireFeedbackEvidenceCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackEvidenceCorrelationUser();
    return apiSuccess(await lineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback evidence lineage.");
  }
}
