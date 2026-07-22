import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceEscalationPatternContractResponse, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(getGovernanceEscalationPatternContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance escalation pattern intelligence contract.");
  }
}
