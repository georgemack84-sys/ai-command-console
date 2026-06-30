import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityContractUser, validateGovernanceIntegrityContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityContractUser();
    return apiSuccess(await validateGovernanceIntegrityContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance integrity contract.");
  }
}
