import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayEscalationDetectionRequest, requireEscalationDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await replayEscalationDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay escalation detection.");
  }
}
