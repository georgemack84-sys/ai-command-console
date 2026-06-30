import { apiError, apiSuccess } from "@/src/server/api/response";
import { getEscalationPrioritizationContractResponse, requireEscalationPrioritizationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationPrioritizationUser();
    return apiSuccess(getEscalationPrioritizationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load escalation prioritization contract.");
  }
}
