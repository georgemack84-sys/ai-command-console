import { apiError, apiSuccess } from "@/src/server/api/response";
import { duplicatesRequest, requireFeedbackIntakeEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackIntakeEngineUser();
    return apiSuccess(await duplicatesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback duplicate status.");
  }
}
