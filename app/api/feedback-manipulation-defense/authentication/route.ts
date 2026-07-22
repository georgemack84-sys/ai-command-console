import { apiError, apiSuccess } from "@/src/server/api/response";
import { authenticationRequest, requireFeedbackManipulationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackManipulationUser();
    return apiSuccess(await authenticationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback authentication report.");
  }
}
