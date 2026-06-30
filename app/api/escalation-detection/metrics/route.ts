import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsEscalationDetectionRequest, requireEscalationDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await metricsEscalationDetectionRequest());
  } catch (error) {
    return apiError(error, "Unable to load escalation detection metrics.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(await metricsEscalationDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load escalation detection metrics.");
  }
}
