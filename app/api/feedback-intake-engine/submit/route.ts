import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFeedbackIntakeEngineUser, submitRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackIntakeEngineUser();
    return apiSuccess(await submitRequest(request));
  } catch (error) {
    return apiError(error, "Unable to submit feedback intake.");
  }
}
