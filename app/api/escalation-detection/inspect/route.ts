import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectEscalationDetectionRequest, requireEscalationDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await inspectEscalationDetectionRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect escalation detection.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await inspectEscalationDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect escalation detection.");
  }
}
