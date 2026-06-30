import { apiError, apiSuccess } from "@/src/server/api/response";
import { getEscalationCertificationContractResponse, requireEscalationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEscalationCertificationUser();
    return apiSuccess(getEscalationCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load escalation certification contract.");
  }
}
