import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsEscalationPrioritizationRequest, requireEscalationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(await metricsEscalationPrioritizationRequest());
  } catch (error) {
    return apiError(error, "Unable to load escalation prioritization metrics.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(await metricsEscalationPrioritizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load escalation prioritization metrics.");
  }
}
