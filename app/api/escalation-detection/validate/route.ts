import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEscalationDetectionUser, validateEscalationDetectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await validateEscalationDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate escalation detection.");
  }
}
