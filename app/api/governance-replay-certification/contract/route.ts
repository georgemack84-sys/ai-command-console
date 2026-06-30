import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceReplayCertificationContractResponse, requireGovernanceReplayCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceReplayCertificationUser();
    return apiSuccess(getGovernanceReplayCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance replay certification contract.");
  }
}
