import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecoveryInterventionContractResponse, requireRecoveryInterventionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecoveryInterventionUser();
    return apiSuccess(getRecoveryInterventionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Recovery & Intervention Intelligence.");
  }
}
