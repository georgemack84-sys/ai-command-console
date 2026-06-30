import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceRiskContract, requireGovernanceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskUser();
    return apiSuccess(getGovernanceRiskContract());
  } catch (error) {
    return apiError(error, "Unable to load Governance Risk contract.");
  }
}
