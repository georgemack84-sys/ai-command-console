import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerGovernanceIntegrityContractRequest, requireGovernanceIntegrityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityContractUser();
    return apiSuccess(await registerGovernanceIntegrityContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register governance integrity contract.");
  }
}
