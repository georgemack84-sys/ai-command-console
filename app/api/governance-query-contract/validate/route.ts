import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceQueryContractUser, validateGovernanceQueryContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(await validateGovernanceQueryContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance query contract.");
  }
}
