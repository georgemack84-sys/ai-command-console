import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectEscalationPrioritizationRequest, requireEscalationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(await inspectEscalationPrioritizationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect escalation prioritization.");
  }
}

export async function POST(request: Request) {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(await inspectEscalationPrioritizationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect escalation prioritization.");
  }
}
