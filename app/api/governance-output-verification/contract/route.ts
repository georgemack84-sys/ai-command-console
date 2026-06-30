import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceOutputVerificationContractResponse, requireGovernanceOutputVerificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceOutputVerificationUser();
    return apiSuccess(getGovernanceOutputVerificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance output verification contract.");
  }
}
