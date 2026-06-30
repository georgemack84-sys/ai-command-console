import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernancePolicyContractResponse, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(getGovernancePolicyContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Governance & Policy Enforcement Engine contract.");
  }
}
