import { apiError, apiSuccess } from "@/src/server/api/response";
import { getEscalationContractResponse, requireEscalationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationContractUser();
    return apiSuccess(getEscalationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load escalation contract.");
  }
}
