import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceAssuranceContractResponse, requireGovernanceAssuranceEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceAssuranceEngineUser();
    return apiSuccess(getGovernanceAssuranceContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Governance Assurance Engine.");
  }
}
