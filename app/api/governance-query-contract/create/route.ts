import { apiError, apiSuccess } from "@/src/server/api/response";
import { createGovernanceQueryContractRequest, requireGovernanceQueryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(await createGovernanceQueryContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create governance query contract.");
  }
}
