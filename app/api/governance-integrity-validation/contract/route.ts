import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceIntegrityValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntegrityValidationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance integrity validation contract.");
  }
}
