import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayCorrelationRequest, replayRequest, requireFeedbackEvidenceCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireFeedbackEvidenceCorrelationUser();
    return apiSuccess(await replayCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve replay correlation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireFeedbackEvidenceCorrelationUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay feedback evidence correlation.");
  }
}
