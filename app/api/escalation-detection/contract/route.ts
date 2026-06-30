import { apiError, apiSuccess } from "@/src/server/api/response";
import { getEscalationDetectionContractResponse, requireEscalationDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationDetectionUser();
    return apiSuccess(getEscalationDetectionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load escalation detection contract.");
  }
}
