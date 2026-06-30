import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceIntegrityContractRequest, requireGovernanceIntegrityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceIntegrityContractUser();
    return apiSuccess(await hashGovernanceIntegrityContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance integrity contract.");
  }
}
