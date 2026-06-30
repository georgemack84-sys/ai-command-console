import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceExplainabilityContractResponse, requireGovernanceExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceExplainabilityUser();
    return apiSuccess(getGovernanceExplainabilityContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve GovernanceExplainability contract.");
  }
}
