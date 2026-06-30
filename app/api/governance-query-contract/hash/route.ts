import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceQueryContractRequest, requireGovernanceQueryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(await hashGovernanceQueryContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance query contract.");
  }
}
